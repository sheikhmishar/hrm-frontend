import { useQuery } from '@tanstack/react-query'
import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ChangeEventHandler
} from 'react'
import { Link } from 'react-router-dom'

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
  getDateRange,
  getEmployeeId,
  stringToDate
} from '../../../libs'
import modifiedFetch from '../../../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type { allCompanies } from 'backend/controllers/companies'
import type { allEmployeeLeaves } from 'backend/controllers/leaves'
import type Employee from 'backend/Entities/Employee'

const LeaveCalender = () => {
  const { self } = useContext(AuthContext)
  const { onErrorDisplayToast } = useContext(ToastContext)

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

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const { data: employeeLeaves = BLANK_ARRAY, isFetching } = useQuery({
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
          } satisfies Partial<typeof ServerSITEMAP.attendances._queries>)
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

  const monthMarker = useMemo(() => {
    const midIndex = calender.findIndex(({ date }) => date === '01')

    const leftMidIndex = Math.floor(midIndex / 2)
    const rightMidIndex = Math.floor(
      midIndex - 1 + (calender.length - midIndex) / 2
    )

    return [leftMidIndex, rightMidIndex] as [number, number]
  }, [calender])

  return (
    <>
      <div className='align-items-center d-flex flex-wrap gap-2 justify-content-between mb-3'>
        <CalenderSlider
          monthly
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
        />
        <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
          <Select
            id='company'
            label=''
            value={companyId}
            onChange={({ target: { value } }) =>
              setCompanyId(parseInt(value) || -1)
            }
            className='w-25'
            options={[{ label: 'All', value: -1 }].concat(
              companies.map(company => ({
                label: company.name,
                value: company.id
              }))
            )}
          />
          <div className='ms-2 w-25'>
            <input
              className='form-control py-2 rounded-3'
              id='search'
              placeholder='Search here'
              onChange={onSearchInputChange}
              value={search}
            />
          </div>
        </ProtectedComponent>
        {(isFetching || fetchingCompanies) && (
          <div className='ms-auto spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        )}
      </div>
      <Table
        columns={['Employee'].concat(
          calender.map(({ date }, i) =>
            calender[i + 1]?.date === '01' ? date + ' | ' : date
          )
        )}
        rows={[
          [<></>].concat(
            calender.map(({ month }, i) => (
              <strong className='text-primary'>
                {monthMarker.includes(i)
                  ? stringToDate(`2011-${month}-01`)
                      .toDateString()
                      .substring(4, 7)
                  : ''}
                {calender[i + 1]?.date === '01' ? (
                  <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| </>
                ) : (
                  ''
                )}
              </strong>
            ))
          )
        ]
          .concat([
            [<></>].concat(
              calender.map(({ dayName }) => (
                <span style={{ fontSize: 12 }} className='text-info'>
                  {dayName}
                </span>
              ))
            )
          ])
          .concat(
            employeeLeaves
              .filter(employee =>
                self?.type === 'Employee' && self.employeeId
                  ? employee.id === self.employeeId
                  : (
                      [
                        'name',
                        'email',
                        'phoneNumber',
                        'altPhoneNumber'
                      ] satisfies KeysOfObjectOfType<
                        Employee,
                        string | undefined
                      >[]
                    ).find(key =>
                      employee[key]
                        ?.toLowerCase()
                        .includes(search.toLowerCase())
                    ) || getEmployeeId(employee).includes(search.toLowerCase())
              )
              .map(employee =>
                [
                  <Link
                    role='button'
                    to={
                      ROUTES.leave.details.replace(
                        ROUTES.leave._params.id,
                        employee.id.toString()
                      ) +
                      '?' +
                      new URLSearchParams({
                        month: fromDateString
                      } satisfies typeof ROUTES.leave._queries)
                    }
                    className='text-decoration-none'
                  >
                    <EmployeeName employee={employee} />
                  </Link>
                ].concat(
                  calender.map(({ month, date }) => {
                    const year =
                      month === '01'
                        ? toDate.getFullYear()
                        : fromDate.getFullYear()
                    const targetDate = stringToDate(`${year}-${month}-${date}`)

                    // FIXME: undefined sometimes
                    const leave = employee.leaves.find(
                      leave =>
                        stringToDate(leave.from) <= targetDate &&
                        stringToDate(leave.to) >= targetDate
                    )
                    if (leave?.duration === 'fullday')
                      return (
                        <div
                          className={
                            leave.type === 'paid'
                              ? 'bg-primary'
                              : 'bg-secondary'
                          }
                          style={{ height: 50, width: 20 }}
                        />
                      )
                    if (leave?.duration === 'first_halfday')
                      return (
                        <>
                          <div
                            className={
                              leave.type === 'paid'
                                ? 'bg-primary'
                                : 'bg-secondary'
                            }
                            style={{ height: 25, width: 20 }}
                          />
                          <div
                            className='bg-transparent'
                            style={{ height: 25, width: 20 }}
                          />
                        </>
                      )
                    if (leave?.duration === 'second_halfday')
                      return (
                        <>
                          <div
                            className='bg-transparent'
                            style={{ height: 25, width: 20 }}
                          />
                          <div
                            className={
                              leave.type === 'paid'
                                ? 'bg-primary'
                                : 'bg-secondary'
                            }
                            style={{ height: 25, width: 20 }}
                          />
                        </>
                      )
                    return <></>
                  })
                )
              )
          )}
      />
    </>
  )
}

export default LeaveCalender
