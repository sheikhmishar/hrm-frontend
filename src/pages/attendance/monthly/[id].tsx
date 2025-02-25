import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ChangeEventHandler,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { FaArrowLeft, FaPen, FaTrash } from 'react-icons/fa6'
import { Link, useLocation, useParams } from 'react-router-dom'
import Papa from 'papaparse'

import Button from '../../../components/Button'
import CalenderSlider from '../../../components/CalenderSlider'
import EmployeeName from '../../../components/EmployeeName'
import Input from '../../../components/Input'
import Modal from '../../../components/Modal'
import ProtectedComponent from '../../../components/ProtectedComponent'
import Table from '../../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../../constants/CONSTANTS'
import { defaultAttendance } from '../../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../../contexts/auth'
import { ToastContext } from '../../../contexts/toast'
import generateCalender, {
  capitalizeDelim,
  dateToString,
  downloadStringAsFile,
  getDateRange,
  getEmployeeId,
  mToHM,
  stringToDate,
  timeToLocaleString
} from '../../../libs'
import modifiedFetch from '../../../libs/modifiedFetch'

import type { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import type Employee from 'backend/Entities/Employee'
import type EmployeeAttendance from 'backend/Entities/EmployeeAttendance'
import type {
  deleteEmployeeAttendance,
  employeeAttendanceDetails,
  updateEmployeeAttendance
} from 'backend/controllers/attendances'
import type { employeeLeaveDetails } from 'backend/controllers/leaves'
import type { holidaysByMonth } from 'backend/controllers/holidays'
import type Holiday from 'backend/Entities/Holiday'

const getCsvFromAttendaces = (
  employee: Employee | undefined,
  leaveDetailsOfEmployee: GetResponseType<typeof employeeLeaveDetails>,
  holidays: Holiday[],
  calender: ReturnType<typeof generateCalender>,
  fromDate: Date,
  toDate: Date
) => {
  const runningDate = new Date()

  if (!employee || !leaveDetailsOfEmployee) return ''
  return Papa.unparse(
    [
      [
        'date',
        'id',
        'employee',
        'designation',
        'attendance',
        'checkIn',
        'officeStart',
        'late',
        'earlyIn',
        'checkOut',
        'officeEnd',
        'overtime',
        'earlyOut',
        'tasks',
        'totalTime',
        'status'
      ]
    ].concat(
      calender.map(({ month, date }) => {
        const year =
          month === '01' ? toDate.getFullYear() : fromDate.getFullYear()
        const dateString = `${month}-${date}`
        const fullDateString = `${year}-${dateString}`
        const fullDate = stringToDate(fullDateString)

        const attendance = employee.attendances?.find(
          attendance => attendance.date.substring(5) === dateString
        )
        const attendanceRow = attendance
          ? [
              timeToLocaleString(attendance.arrivalTime),
              timeToLocaleString(employee.officeStartTime),

              attendance.late === -1
                ? 'N/A'
                : mToHM(Math.max(0, attendance.late)),
              attendance.late === -1
                ? 'N/A'
                : mToHM(Math.abs(Math.min(0, attendance.late))),
              timeToLocaleString(attendance.leaveTime),
              timeToLocaleString(employee.officeEndTime),

              attendance.overtime === -1
                ? 'N/A'
                : mToHM(Math.max(0, attendance.overtime)),
              attendance.overtime === -1
                ? 'N/A'
                : mToHM(Math.abs(Math.min(0, attendance.overtime))),
              (employee.taskWisePayment && attendance.tasks) || 'N/A',
              mToHM(attendance.totalTime),

              (attendance.late === -1
                ? 'N/A'
                : attendance.late === 0
                ? 'In time'
                : attendance.late < 0
                ? 'Early In'
                : 'Late In') +
                '|' +
                (attendance.overtime === -1
                  ? 'N/A'
                  : attendance.overtime === 0
                  ? 'On time'
                  : attendance.overtime < 0
                  ? 'Early Out'
                  : 'Overtime')
            ]
          : []

        return [
          fullDateString,
          getEmployeeId(employee),
          employee.name,
          employee.designation.name
        ].concat(
          // FIXME; undefined ?
          attendance
            ? [
                holidays.find(({ date: d }) => dateString === d.substring(5))
                  ? 'OA'
                  : leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
                      ({ from, to, duration, type }) =>
                        type === 'paid' &&
                        stringToDate(from) <= fullDate &&
                        stringToDate(to) >= fullDate &&
                        duration !== 'fullday'
                    )
                  ? 'L/2(P)'
                  : 'P'
              ].concat(attendanceRow)
            : [
                holidays.find(({ date: d }) => dateString === d.substring(5))
                  ? 'O'
                  : leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
                      // TODO: precompute
                      ({ from, to, duration, type }) =>
                        type === 'paid' &&
                        stringToDate(from) <= fullDate &&
                        stringToDate(to) >= fullDate &&
                        duration === 'fullday'
                    )
                  ? 'L'
                  : leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
                      ({ from, to, duration, type }) =>
                        type === 'paid' &&
                        stringToDate(from) <= fullDate &&
                        stringToDate(to) >= fullDate &&
                        duration !== 'fullday'
                    )
                  ? 'L/2'
                  : fullDate > runningDate
                  ? '-'
                  : 'A'
              ].concat(new Array<string>(12).fill(''))
        )
      })
    )
  )
}

const AttendanceDetails = () => {
  const { self } = useContext(AuthContext)
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const location = useLocation()
  const { month: monthFromQuery } = useMemo(
    () =>
      Object.fromEntries(new URLSearchParams(location.search)) as Partial<
        (typeof ROUTES)['attendance']['_queries']
      >,
    [location.search]
  )

  const [id, setId] = useState(-1)
  const { id: idFromParam = '-1' } =
    useParams<(typeof ROUTES)['attendance']['_params']>()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendance, setAttendance] = useState<EmployeeAttendance>({
    ...defaultAttendance
  })
  const onAttendanceChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setAttendance(attendance => ({ ...attendance, [id]: value }))

  useEffect(
    () =>
      setCurrentDate(currentDate =>
        stringToDate(monthFromQuery || currentDate.toDateString())
      ),
    [monthFromQuery]
  )

  useEffect(() => {
    if (self?.type === 'Employee' && self.employeeId) setId(self.employeeId)
    else setId(parseInt(idFromParam) || -1)
  }, [self, idFromParam])

  const [fromDate, toDate] = useMemo(
    () => getDateRange(currentDate),
    [currentDate]
  )
  const [fromDateString, toDateString] = useMemo(
    () => [fromDate, toDate].map(dateToString) as [string, string],
    [fromDate, toDate]
  )

  const calender = useMemo(
    () => generateCalender(fromDate, toDate),
    [fromDate, toDate]
  )

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setAttendance(attendance => ({ ...attendance, _id: -1 }))
      return !sidebar
    })

  const {
    data: attendanceDetails,
    isFetching: _isFetching,
    refetch
  } = useQuery({
    queryKey: [
      'employeeAttendanceDetails',
      ServerSITEMAP.attendances.getByEmployeeId,
      fromDateString,
      toDateString
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof employeeAttendanceDetails>>(
        ServerSITEMAP.attendances.getByEmployeeId.replace(
          ServerSITEMAP.attendances._params.employeeId,
          id.toString()
        ) +
          '?' +
          new URLSearchParams({
            from: fromDateString,
            to: toDateString
          } satisfies Partial<typeof ServerSITEMAP.attendances._queries>)
      ),
    enabled: id > 0
    // TODO: error with status handling
  })

  const {
    data: leaveDetailsOfEmployee,
    isFetching: fetchingEmployeeLeaves,
    refetch: refetchEmployeeLeaves
  } = useQuery({
    queryKey: [
      'employeeLeaveDetails',
      ServerSITEMAP.leaves.getByEmployeeId,
      fromDateString,
      toDateString
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof employeeLeaveDetails>>(
        ServerSITEMAP.leaves.getByEmployeeId.replace(
          ServerSITEMAP.leaves._params.employeeId,
          id.toString()
        ) +
          '?' +
          new URLSearchParams({
            from: fromDateString,
            to: toDateString
          } satisfies Partial<typeof ServerSITEMAP.leaves._queries>)
      ),
    enabled: id > 0
  })

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

  const { isLoading: updateAttendanceLoading, mutate: updateAttendance } =
    useMutation({
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof updateEmployeeAttendance>>(
          ServerSITEMAP.attendances.put.replace(
            ServerSITEMAP.attendances._params.id,
            attendance.id.toString()
          ),
          {
            method: 'put',
            body: JSON.stringify(
              // TODO: everywhere
              attendance satisfies GetReqBodyType<
                typeof updateEmployeeAttendance
              >
            )
          }
        ),
      mutationKey: [
        'updateEmployeeAttendance',
        ServerSITEMAP.attendances.put,
        attendance
      ],
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetch()
        refetchEmployeeLeaves()
      },
      onError: onErrorDisplayToast,
      retry: false
    })

  const { isLoading: deleteAttendanceLoading, mutate: deleteAttendance } =
    useMutation({
      mutationFn: (id: number) =>
        modifiedFetch<GetResponseType<typeof deleteEmployeeAttendance>>(
          ServerSITEMAP.attendances.delete.replace(
            ServerSITEMAP.attendances._params.id,
            id.toString()
          ),
          { method: 'delete' }
        ),
      mutationKey: [
        'deleteEmployeeAttendance',
        ServerSITEMAP.attendances.delete
      ],
      onSuccess: data => {
        data?.message && addToast(data.message)
        refetch()
        refetchEmployeeLeaves()
      },
      onError: onErrorDisplayToast,
      retry: false
    })

  const isFetching =
    _isFetching ||
    updateAttendanceLoading ||
    deleteAttendanceLoading ||
    fetchingEmployeeLeaves ||
    holidaysLoading

  const runningDate = new Date()

  return (
    <>
      <div className='align-items-center d-flex flex-wrap gap-2 justify-content-between mb-3'>
        <Link
          // TODO: add from
          to={ROUTES.attendance.monthly}
          className='link-primary text-decoration-none'
        >
          <FaArrowLeft /> Attendance List
        </Link>
        <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
          <Button
            onClick={() =>
              downloadStringAsFile(
                getCsvFromAttendaces(
                  attendanceDetails,
                  leaveDetailsOfEmployee,
                  holidays,
                  calender,
                  fromDate,
                  toDate
                ),
                'employeeAttendances.csv',
                { type: 'text/csv' }
              )
            }
            className={`btn-primary${_isFetching ? '' : ' me-auto'}`}
          >
            Export CSV
          </Button>
        </ProtectedComponent>

        {_isFetching && (
          <div
            className='me-auto ms-3 spinner-border text-primary'
            role='status'
          >
            <span className='visually-hidden'>Loading...</span>
          </div>
        )}

        <CalenderSlider
          monthly
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
        />
      </div>

      {attendanceDetails && (
        <div className='mb-3'>
          <Link
            className='text-decoration-none'
            role='button'
            to={ROUTES.employee.details.replace(
              ROUTES.employee._params.id,
              attendanceDetails.id.toString()
            )}
          >
            <EmployeeName
              employee={{
                id: attendanceDetails.id,
                dateOfJoining: attendanceDetails.dateOfJoining,
                name: attendanceDetails.name,
                designation: attendanceDetails.designation.name,
                email: attendanceDetails.email,
                photo: attendanceDetails.photo
              }}
            />
          </Link>
        </div>
      )}

      <Table
        columns={[
          'Date',
          'Attendance',
          'Check In',
          'Office Start',
          'Late',
          'Early In',
          'Check Out',
          'Office End',
          'Overtime',
          'Early Out',
          'Tasks',
          'Total Time',
          'Status',
          'Action'
        ]}
        rows={
          attendanceDetails
            ? calender.map(({ month, date }) => {
                const year =
                  month === '01' ? toDate.getFullYear() : fromDate.getFullYear()
                const dateString = `${month}-${date}`
                const fullDateString = `${year}-${dateString}`
                const fullDate = stringToDate(fullDateString)

                const attendance = attendanceDetails.attendances?.find(
                  attendance => attendance.date.substring(5) === dateString
                )
                const attendanceRow = attendance
                  ? [
                      <>{timeToLocaleString(attendance.arrivalTime)}</>,
                      <>
                        {timeToLocaleString(attendanceDetails.officeStartTime)}
                      </>,
                      <>
                        {attendance.late === -1
                          ? 'N/A'
                          : mToHM(Math.max(0, attendance.late))}
                      </>,
                      <>
                        {attendance.late === -1
                          ? 'N/A'
                          : mToHM(Math.abs(Math.min(0, attendance.late)))}
                      </>,
                      <>{timeToLocaleString(attendance.leaveTime)}</>,
                      <>
                        {timeToLocaleString(attendanceDetails.officeEndTime)}
                      </>,
                      <>
                        {attendance.overtime === -1
                          ? 'N/A'
                          : mToHM(Math.max(0, attendance.overtime))}
                      </>,
                      <>
                        {attendance.overtime === -1
                          ? 'N/A'
                          : mToHM(Math.abs(Math.min(0, attendance.overtime)))}
                      </>,
                      <>
                        {(attendanceDetails.taskWisePayment &&
                          attendance.tasks) ||
                          'N/A'}
                      </>,
                      <>{mToHM(attendance.totalTime)}</>,
                      <>
                        <span
                          className={
                            attendance.late === -1
                              ? ''
                              : attendance.late === 0
                              ? 'text-bg-warning'
                              : attendance.late < 0
                              ? 'text-bg-success'
                              : 'text-bg-danger'
                          }
                        >
                          {attendance.late === -1
                            ? 'N/A'
                            : attendance.late === 0
                            ? 'In time'
                            : attendance.late < 0
                            ? 'Early In'
                            : 'Late In'}
                        </span>
                        |
                        <span
                          className={
                            attendance.overtime === -1
                              ? ''
                              : attendance.overtime === 0
                              ? 'text-bg-warning'
                              : attendance.overtime < 0
                              ? 'text-bg-danger'
                              : 'text-bg-success'
                          }
                        >
                          {attendance.overtime === -1
                            ? 'N/A'
                            : attendance.overtime === 0
                            ? 'On time'
                            : attendance.overtime < 0
                            ? 'Early Out'
                            : 'Overtime'}
                        </span>
                      </>,
                      <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
                        <Button
                          disabled={isFetching}
                          onClick={() => {
                            // FIXME ||[]
                            const foundAttendance = (
                              attendanceDetails.attendances || []
                            ).find(att => att.id === attendance.id)
                            console.log(foundAttendance)

                            if (foundAttendance) {
                              // FIXME: not changing
                              setAttendance(foundAttendance)
                              toggleSidebar()
                            } else addToast('Invalid Entry', 'ERROR')
                          }}
                          className='border-0 link-primary text-body'
                        >
                          <FaPen />
                        </Button>
                        <Button
                          disabled={isFetching}
                          onClick={() => deleteAttendance(attendance.id)}
                          className='border-0 link-primary text-body'
                        >
                          <FaTrash />
                        </Button>
                      </ProtectedComponent>
                    ]
                  : []

                return [
                  <span className='text-nowrap'>{fullDateString}</span>
                ].concat(
                  // FIXME; undefined ?
                  attendance
                    ? [
                        holidays.find(
                          ({ date: d }) => dateString === d.substring(5)
                        ) ? (
                          <strong className='text-success'>OA</strong>
                        ) : leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
                            ({ from, to, duration, type }) =>
                              type === 'paid' &&
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
                      ].concat(attendanceRow)
                    : [
                        holidays.find(
                          ({ date: d }) => dateString === d.substring(5)
                        ) ? (
                          <strong className='text-black-50'>O</strong>
                        ) : leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
                            // TODO: precompute
                            ({ from, to, duration, type }) =>
                              type === 'paid' &&
                              stringToDate(from) <= fullDate &&
                              stringToDate(to) >= fullDate &&
                              duration === 'fullday'
                          ) ? (
                          <strong className='text-black-50'>L</strong>
                        ) : leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
                            ({ from, to, duration, type }) =>
                              type === 'paid' &&
                              stringToDate(from) <= fullDate &&
                              stringToDate(to) >= fullDate &&
                              duration !== 'fullday'
                          ) ? (
                          <strong className='text-black-50'>L/2</strong>
                        ) : (
                          <strong className='text-danger'>
                            {fullDate > runningDate ? '-' : 'A'}
                          </strong>
                        )
                      ].concat([
                        <></>,
                        <></>,
                        <></>,
                        <></>,
                        <></>,
                        <></>,
                        <></>,
                        <></>,
                        <></>,
                        <></>,
                        <></>,
                        <></>
                      ])
                )
              })
            : []
        }
      />

      <Modal isOpen={sidebar} setIsOpen={setSidebar}>
        <Modal.Header
          title={`${attendance.id === -1 ? 'Add' : 'Update'} Attendance`}
          close={toggleSidebar}
        />
        <Modal.Body>
          {(
            ['date'] satisfies KeysOfObjectOfType<EmployeeAttendance, string>[]
          ).map(k => (
            <Input
              key={k}
              disabled={isFetching}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              type='date'
              value={attendance[k]}
              onChange={onAttendanceChange}
            />
          ))}
          {(
            ['arrivalTime', 'leaveTime'] satisfies KeysOfObjectOfType<
              EmployeeAttendance,
              string
            >[]
          ).map(k => (
            <Input
              key={k}
              disabled={isFetching}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              type='time'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={attendance[k]}
              onChange={onAttendanceChange}
            />
          ))}
          {(
            ['late', 'overtime', 'totalTime'] satisfies KeysOfObjectOfType<
              EmployeeAttendance,
              number
            >[]
          ).map(k => (
            <Input
              key={k}
              disabled={isFetching}
              id={k}
              label={capitalizeDelim(k) + ' Minutes'}
              containerClass='my-3'
              type='number'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={attendance[k]}
              onChange={onAttendanceChange}
            />
          ))}
          {(
            ['tasks'] satisfies KeysOfObjectOfType<
              EmployeeAttendance,
              string | undefined
            >[]
          ).map(k => (
            <Input
              key={k}
              disabled={isFetching}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={attendance[k] || ''}
              onChange={onAttendanceChange}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={false}
              className='btn-primary mx-2'
              onClick={() => updateAttendance()}
            >
              <span className='align-items-center d-flex'>
                Update
                {isFetching && (
                  <div
                    className='ms-2 spinner-border spinner-border-sm text-light'
                    role='status'
                  >
                    <span className='visually-hidden'>Loading...</span>
                  </div>
                )}
              </span>
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default AttendanceDetails
