import { useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ChangeEventHandler
} from 'react'
import { Link } from 'react-router-dom'

import Button from '../../../components/Button'
import CalenderSlider from '../../../components/CalenderSlider'
import EmployeeName from '../../../components/EmployeeName'
import ProtectedComponent from '../../../components/ProtectedComponent'
import Select from '../../../components/Select'
import Table from '../../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../../constants/CONSTANTS'
import ServerSITEMAP from '../../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../../contexts/auth'
import { ToastContext } from '../../../contexts/toast'
import generateCalender, {
  dateToString,
  dayDifference,
  downloadStringAsFile,
  getDateRange,
  getEmployeeId,
  stringToDate
} from '../../../libs'
import modifiedFetch from '../../../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type { allEmployeeAttendances } from 'backend/controllers/attendances'
import type { allCompanies } from 'backend/controllers/companies'
import type { holidaysByMonth } from 'backend/controllers/holidays'
import type { allEmployeeLeaves } from 'backend/controllers/leaves'
import type Employee from 'backend/Entities/Employee'
import type Holiday from 'backend/Entities/Holiday'

const getCsvFromAttendaces = (
  calender: ReturnType<typeof generateCalender>,
  fromDate: Date,
  toDate: Date,
  holidays: Holiday[],
  employeeLeaves: Employee[],
  employeeAttendances: Employee[]
) =>
  Papa.unparse(
    [
      ['Id', 'Name']
        .concat(calender.map(({ date }) => (date === '01' ? ' |  01' : date)))
        .concat(['Total P', 'Total L', 'Total A', 'Total OA'])
    ]
      .concat([
        ['', ''].concat(
          calender.map(
            ({ date, month }) =>
              (date.endsWith('22') || date.endsWith('07')
                ? stringToDate(`2011-${month}-01`)
                    .toDateString()
                    .substring(4, 7)
                : '') + (date.endsWith('01') ? '|' : '')
          )
        )
      ])
      .concat([['', ''].concat(calender.map(({ dayName }) => dayName))])
      .concat(
        employeeAttendances.map(employee => {
          const currentDate = new Date()
          const paidLeaves = (
            employeeLeaves.find(({ id }) => employee.id === id)?.leaves || []
          ).filter(({ type }) => type === 'paid')

          const daysTillToday = calender.filter(
            ({ month, date }) =>
              stringToDate(
                `${
                  month === '01' ? toDate.getFullYear() : fromDate.getFullYear()
                }-${month}-${date}`
              ) <= currentDate
          ).length // TODO: math

          const holidaysAfterToday = holidays.filter(
            ({ date }) => stringToDate(date) > currentDate
          ).length

          const paidLeavesAfterToday = paidLeaves.reduce(
            (total, { from, to, duration }) => {
              const fromDate = new Date(from)
              const toDate = new Date(to)

              return (
                total +
                (currentDate < fromDate && currentDate < toDate
                  ? dayDifference(fromDate, toDate)
                  : currentDate > toDate
                  ? 0
                  : dayDifference(currentDate, toDate)) *
                  (duration === 'fullday' ? 1 : 0.5)
              )
            },
            0
          )

          const totalDays =
            daysTillToday + holidaysAfterToday + paidLeavesAfterToday

          const presentWithNoHolidayOrFullPaidLeave =
            employee.attendances.reduce((total, attendance) => {
              const date = stringToDate(attendance.date)

              const paidLeave = paidLeaves.find(
                ({ from, to }) =>
                  stringToDate(from) <= date && date <= stringToDate(to)
              )
              return (
                total +
                (holidays.find(({ date }) => date === attendance.date)
                  ? 0
                  : paidLeave
                  ? paidLeave.duration === 'fullday'
                    ? 0
                    : 0.5
                  : 1)
              )
            }, 0)

          const paidLeavesTotal = paidLeaves.reduce(
            (total, { totalDays }) => total + totalDays,
            0
          )

          const holidayAttendances = employee.attendances.filter(attendance =>
            holidays.find(({ date }) => date === attendance.date)
          ).length

          return [getEmployeeId(employee), employee.name]
            .concat(
              calender.map(({ month, date }) => {
                const year =
                  month === '01' ? toDate.getFullYear() : fromDate.getFullYear()
                const dateString = `${month}-${date}`
                const fullDate = stringToDate(`${year}-${dateString}`)

                // FIXME; undefined ?
                return employee.attendances?.find(
                  attendance => attendance.date.substring(5) === dateString
                )
                  ? holidays.find(
                      ({ date: d }) => dateString === d.substring(5)
                    )
                    ? 'OA'
                    : paidLeaves.find(
                        ({ from, to, duration }) =>
                          stringToDate(from) <= fullDate &&
                          stringToDate(to) >= fullDate &&
                          duration !== 'fullday'
                      )
                    ? 'L/2(P)'
                    : 'P'
                  : holidays.find(
                      ({ date: d }) => dateString === d.substring(5)
                    )
                  ? 'O'
                  : paidLeaves.find(
                      // TODO: precompute
                      ({ from, to, duration }) =>
                        stringToDate(from) <= fullDate &&
                        stringToDate(to) >= fullDate &&
                        duration === 'fullday'
                    )
                  ? 'L'
                  : paidLeaves.find(
                      ({ from, to, duration }) =>
                        stringToDate(from) <= fullDate &&
                        stringToDate(to) >= fullDate &&
                        duration !== 'fullday'
                    )
                  ? 'L/2'
                  : fullDate > new Date()
                  ? '-'
                  : 'A'
              })
            )
            .concat(
              [
                presentWithNoHolidayOrFullPaidLeave,
                paidLeavesTotal,
                totalDays -
                  presentWithNoHolidayOrFullPaidLeave -
                  holidays.length -
                  paidLeavesTotal,
                holidayAttendances
              ].map(n => n.toString())
            )
        })
      )
  )

const MonthlyAttendance = () => {
  const { self } = useContext(AuthContext)
  const { onErrorDisplayToast } = useContext(ToastContext)

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)
  const [companyId, setCompanyId] = useState(-1)
  const [currentDate, setCurrentDate] = useState(new Date())

  const [fromDate, toDate] = useMemo(
    () => getDateRange(currentDate),
    [currentDate]
  )
  const [fromDateString, toDateString] = useMemo(
    () => [fromDate, toDate].map(dateToString) as [string, string],
    [fromDate, toDate]
  )

  useEffect(
    () => setCurrentDate(stringToDate(fromDateString)),
    [fromDateString]
  )

  const { data: holidays = BLANK_ARRAY, isFetching: holidaysLoading } =
    useQuery({
      queryKey: [
        'holidays',
        ServerSITEMAP.holidays.getByMonthStart,
        fromDateString
      ],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof holidaysByMonth>>(
          ServerSITEMAP.holidays.getByMonthStart.replace(
            ServerSITEMAP.holidays._params.monthStart,
            fromDateString
          )
        ),
      onError: onErrorDisplayToast
    })

  const {
    data: _employeeAttendances = BLANK_ARRAY,
    isFetching: employeeAttendancesFetching
  } = useQuery({
    queryKey: [
      'employeeAttendances',
      ServerSITEMAP.attendances.get,
      fromDateString,
      toDateString
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployeeAttendances>>(
        ServerSITEMAP.attendances.get +
          '?' +
          new URLSearchParams({
            from: fromDateString,
            to: toDateString
          } satisfies Partial<typeof ServerSITEMAP.attendances._queries>)
      ),
    onError: onErrorDisplayToast
  })

  const { data: employeeLeaves = BLANK_ARRAY, isFetching: fetchingLeaves } =
    useQuery({
      queryKey: [
        'employeeLeaves',
        ServerSITEMAP.leaves.get,
        fromDateString,
        toDateString
      ],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof allEmployeeLeaves>>(
          ServerSITEMAP.leaves.get +
            '?' +
            new URLSearchParams({
              from: fromDateString,
              to: toDateString
            } satisfies typeof ServerSITEMAP.leaves._queries)
        ),
      onError: onErrorDisplayToast
    })

  const { data: companies = BLANK_ARRAY, isFetching: fetchingCompanies } =
    useQuery({
      queryKey: ['companies', ServerSITEMAP.companies.get],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof allCompanies>>(
          ServerSITEMAP.companies.get
        ),
      onError: onErrorDisplayToast
    })

  const calender = useMemo(
    () => generateCalender(fromDate, toDate),
    [fromDate, toDate]
  )

  const employeeAttendances = useMemo(
    () =>
      _employeeAttendances.filter(
        employee =>
          ((['name', 'email', 'phoneNumber'] satisfies (keyof Employee)[]).find(
            key =>
              employee[key]
                .toString()
                .toLowerCase()
                .includes(search.toLowerCase())
          ) ||
            getEmployeeId(employee).includes(search)) &&
          (self?.type === 'Employee' && self.employeeId
            ? employee.id === self.employeeId
            : companyId !== -1
            ? employee.company.id === companyId
            : true)
      ),
    [_employeeAttendances, search, companyId, self?.employeeId, self?.type]
  )

  const isFetching =
    employeeAttendancesFetching ||
    fetchingCompanies ||
    holidaysLoading ||
    fetchingLeaves

  return (
    <>
      <div className='align-items-center d-flex flex-wrap gap-2 justify-content-between mb-3'>
        <CalenderSlider
          monthly
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
        />

        <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
          <div className='col-3'>
            <Select
              id='company'
              label=''
              value={companyId}
              onChange={({ target: { value } }) =>
                setCompanyId(parseInt(value) || -1)
              }
              options={[{ label: 'All', value: -1 }].concat(
                companies.map(company => ({
                  label: company.name,
                  value: company.id
                }))
              )}
            />
          </div>
          <Button
            onClick={() =>
              downloadStringAsFile(
                getCsvFromAttendaces(
                  calender,
                  fromDate,
                  toDate,
                  holidays,
                  employeeLeaves,
                  employeeAttendances
                ),
                'monthlyAttendanceCalendar.csv',
                { type: 'text/csv' }
              )
            }
            className='btn-primary'
          >
            Export CSV
          </Button>
        </ProtectedComponent>

        <div className='ms-2 w-25'>
          <input
            className='form-control py-2 rounded-3'
            id='search'
            placeholder='Search here'
            onChange={onSearchInputChange}
            value={search}
          />
        </div>

        {isFetching && (
          <div className='ms-3 spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        )}
        <div className='d-flex flex-column ms-auto py-2'>
          <span className='text-nowrap'>
            <strong className='text-primary'>P</strong> = Present,
          </span>
          <span className='text-nowrap'>
            <strong className='text-danger'>A</strong> = Absent / Leave Without
            Payment,
          </span>
          <span className='text-nowrap'>
            <strong className='text-danger'>-</strong> = Future,
          </span>
          <span className='text-nowrap'>
            <strong className='text-black-50'>O</strong> = Offday,
          </span>
          <span className='text-nowrap'>
            <strong className='text-black-50'>L</strong>,&nbsp;
            <strong className='text-black-50'>L</strong>
            <strong className='text-success'>/2</strong> or&nbsp;
            <strong className='text-black-50'>L/2</strong> = Paid Leave,
          </span>
          <span className='text-nowrap'>
            <strong className='text-success'>OA</strong> = Offday Attendance
          </span>
        </div>
      </div>

      <Table
        columns={['Employee']
          .concat(calender.map(({ date }) => (date === '01' ? ' |  01' : date)))
          .concat(['Total P', 'Total L', 'Total A', 'Total OA'])}
        rows={[
          [<></>]
            .concat(
              calender.map(({ date, month }) => (
                <strong className='text-primary'>
                  {date.endsWith('22') || date.endsWith('07')
                    ? stringToDate(`2011-${month}-01`)
                        .toDateString()
                        .substring(4, 7)
                    : ''}
                  {date.endsWith('01') ? '|' : ''}
                </strong>
              ))
            )
            .concat([<></>, <></>, <></>, <></>])
        ]
          .concat([
            [<></>]
              .concat(
                calender.map(({ dayName }) => (
                  <span style={{ fontSize: 12 }} className='text-info'>
                    {dayName}
                  </span>
                ))
              )
              .concat([<></>, <></>, <></>, <></>])
          ])
          .concat(
            employeeAttendances.map(employee => {
              const currentDate = new Date()

              const paidLeaves = (
                employeeLeaves.find(({ id }) => employee.id === id)?.leaves ||
                []
              ).filter(({ type }) => type === 'paid')

              const daysTillToday = calender.filter(
                ({ month, date }) =>
                  stringToDate(
                    `${
                      month === '01'
                        ? toDate.getFullYear()
                        : fromDate.getFullYear()
                    }-${month}-${date}`
                  ) <= currentDate
              ).length // TODO: math

              const holidaysAfterToday = holidays.filter(
                ({ date }) => stringToDate(date) > currentDate
              ).length

              const paidLeavesAfterToday = paidLeaves.reduce(
                (total, { from, to, duration }) => {
                  const fromDate = new Date(from)
                  const toDate = new Date(to)

                  return (
                    total +
                    (currentDate < fromDate && currentDate < toDate
                      ? dayDifference(fromDate, toDate)
                      : currentDate > toDate
                      ? 0
                      : dayDifference(currentDate, toDate)) *
                      (duration === 'fullday' ? 1 : 0.5)
                  )
                },
                0
              )

              const totalDays =
                daysTillToday + holidaysAfterToday + paidLeavesAfterToday

              // TODO: half day attendance backend
              const presentWithNoHolidayOrFullPaidLeave =
                employee.attendances.reduce((total, attendance) => {
                  const date = stringToDate(attendance.date)

                  const paidLeave = paidLeaves.find(
                    ({ from, to }) =>
                      date >= stringToDate(from) && date <= stringToDate(to)
                  )
                  return (
                    total +
                    (holidays.find(({ date }) => date === attendance.date)
                      ? 0
                      : paidLeave
                      ? paidLeave.duration === 'fullday'
                        ? 0
                        : 0.5
                      : 1)
                  )
                }, 0)

              const paidLeavesTotal = paidLeaves.reduce(
                (total, { totalDays }) => total + totalDays,
                0
              )

              const holidayAttendances = employee.attendances.filter(
                attendance =>
                  holidays.find(({ date }) => date === attendance.date)
              ).length

              return [
                <Link
                  to={
                    ROUTES.attendance.details.replace(
                      ROUTES.attendance._params.id,
                      employee.id.toString()
                    ) +
                    '?' +
                    new URLSearchParams({
                      month: fromDateString
                    } satisfies typeof ROUTES.attendance._queries)
                  }
                  className='text-decoration-none'
                >
                  <EmployeeName
                    employee={{
                      id: employee.id,
                      dateOfJoining: employee.dateOfJoining,
                      name: employee.name,
                      designation: employee.designation.name,
                      email: employee.email,
                      photo: employee.photo
                    }}
                  />
                </Link>
              ]
                .concat(
                  calender.map(({ month, date }) => {
                    const year =
                      month === '01'
                        ? toDate.getFullYear()
                        : fromDate.getFullYear()
                    const dateString = `${month}-${date}`
                    const fullDate = stringToDate(`${year}-${dateString}`)

                    // FIXME; undefined ?
                    // TODO: update csv
                    return employee.attendances?.find(
                      attendance => attendance.date.substring(5) === dateString
                    ) ? (
                      holidays.find(
                        ({ date: d }) => dateString === d.substring(5)
                      ) ? (
                        <strong className='text-success'>OA</strong>
                      ) : paidLeaves.find(
                          ({ from, to, duration }) =>
                            stringToDate(from) <= fullDate &&
                            stringToDate(to) >= fullDate &&
                            duration !== 'fullday'
                        ) ? (
                        <>
                          <strong className='text-black-50'>L</strong>
                          <strong className='text-success'>/2</strong>
                        </>
                      ) : (
                        <strong className='text-primary'>P</strong>
                      )
                    ) : holidays.find(
                        ({ date: d }) => dateString === d.substring(5)
                      ) ? (
                      <strong className='text-black-50'>O</strong>
                    ) : paidLeaves.find(
                        // TODO: precompute
                        ({ from, to, duration }) =>
                          stringToDate(from) <= fullDate &&
                          stringToDate(to) >= fullDate &&
                          duration === 'fullday'
                      ) ? (
                      <strong className='text-black-50'>L</strong>
                    ) : paidLeaves.find(
                        ({ from, to, duration }) =>
                          stringToDate(from) <= fullDate &&
                          stringToDate(to) >= fullDate &&
                          duration !== 'fullday'
                      ) ? (
                      <strong className='text-black-50'>L/2</strong>
                    ) : (
                      <strong className='text-danger'>
                        {fullDate > currentDate ? '-' : 'A'}
                      </strong>
                    )
                  })
                )
                .concat([
                  <>{presentWithNoHolidayOrFullPaidLeave}</>,
                  <>{paidLeavesTotal}</>,
                  <>
                    {totalDays -
                      presentWithNoHolidayOrFullPaidLeave -
                      holidays.length -
                      paidLeavesTotal}
                  </>,
                  <>{holidayAttendances}</>
                ])
            })
          )}
      />
    </>
  )
}

export default MonthlyAttendance
