import { useMutation, useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ChangeEventHandler
} from 'react'
import { FaPen, FaTrash } from 'react-icons/fa6'
import { Link } from 'react-router-dom'

import Button from '../../components/Button'
import CalenderSlider from '../../components/CalenderSlider'
import EmployeeName from '../../components/EmployeeName'
import Input from '../../components/Input'
import Modal from '../../components/Modal'
import ProtectedComponent from '../../components/ProtectedComponent'
import Table from '../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../constants/CONSTANTS'
import {
  defaultAttendance,
  defaultAttendanceSession
} from '../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../contexts/auth'
import { ToastContext } from '../../contexts/toast'
import {
  capitalizeDelim,
  dateToString,
  downloadStringAsFile,
  getDateRange,
  getEmployeeId,
  mToHM,
  stringToDate,
  timeToDate,
  timeToLocaleString
} from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import Employee from 'backend/Entities/Employee'
import EmployeeAttendance from 'backend/Entities/EmployeeAttendance'
import {
  allEmployeeAttendances,
  deleteEmployeeAttendance,
  updateEmployeeAttendance
} from 'backend/controllers/attendances'

const getCsvFromAttendaces = (employees: Employee[]) =>
  Papa.unparse(
    employees.reduce(
      (prev, employee) =>
        prev.concat(
          employee.attendances.map(
            ({ date, sessions, overtime, late, totalTime, tasks }) => ({
              date,
              id: getEmployeeId(employee),
              employee: employee.name,
              designation: employee.designation.name,
              sessions: sessions
                .map(
                  session =>
                    timeToLocaleString(session.arrivalTime) +
                    (session.leaveTime
                      ? ' -> ' + timeToLocaleString(session.leaveTime)
                      : '')
                )
                .join(', '),
              late: late === -1 ? 'N/A' : Math.max(0, late) + ' minutes',
              overtime:
                overtime === -1 ? 'N/A' : Math.max(0, overtime) + ' minutes',
              tasks: tasks || 'N/A',
              totalTime: Math.max(0, totalTime) + ' minutes'
            })
          )
        ),
      [] as { [x: string]: number | string }[]
    ),
    {
      columns: [
        'date',
        'id',
        'employee',
        'designation',
        'sessions',
        'late',
        'overtime',
        'tasks',
        'totalTime'
      ]
    }
  )

const AttendanceTimesheet = () => {
  const { self } = useContext(AuthContext)
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendance, setAttendance] = useState<EmployeeAttendance>({
    ...defaultAttendance
  })

  const onAttendanceChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setAttendance(attendance => ({ ...attendance, [id]: value }))

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

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setAttendance(attendance => ({ ...attendance, _id: -1 }))
      return !sidebar
    })

  const {
    data: attendances = BLANK_ARRAY,
    isFetching: _isFetching,
    refetch
  } = useQuery({
    queryKey: [
      'allEmployeeAttendances',
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
      },
      onError: onErrorDisplayToast,
      retry: false
    })

  const isFetching =
    _isFetching || updateAttendanceLoading || deleteAttendanceLoading

  useEffect(() => {
    const interval = setInterval(refetch, 3000)
    return () => clearInterval(interval)
  }, [refetch])

  return (
    <>
      <div className='align-items-center d-flex flex-wrap gap-2 mb-3'>
        <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
          <Button
            onClick={() =>
              downloadStringAsFile(
                getCsvFromAttendaces(attendances),
                'employeeAttendances.csv',
                { type: 'text/csv' }
              )
            }
            className='btn-primary mx-3'
          >
            Export CSV
          </Button>
        </ProtectedComponent>

        {_isFetching && (
          <div className='mx-3 spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        )}
        <div className='ms-auto'>
          <CalenderSlider
            monthly
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          />
        </div>
      </div>
      <Table
        columns={[
          'Date',
          'Employee',
          'Sessions',
          'Office Start',
          'Late',
          'Early In',
          'Office End',
          'Overtime',
          'Early Out',
          'Tasks',
          'Total Time',
          'Status',
          'Action'
        ]}
        rows={attendances
          .filter(({ id }) =>
            self?.type === 'Employee' && self.employeeId
              ? id === self.employeeId
              : true
          )
          .reduce(
            (prev, employee) =>
              prev.concat(
                // FIXME: ?
                (employee.attendances || []).map(attendance => [
                  <>{attendance.date}</>,
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
                    <EmployeeName employee={employee} />
                  </Link>,
                  <>
                    {attendance.sessions.map(session => (
                      <div key={session.id} className='text-nowrap'>
                        {timeToLocaleString(session.arrivalTime) +
                          (session.leaveTime
                            ? ' -> ' + timeToLocaleString(session.leaveTime)
                            : '')}
                      </div>
                    ))}
                  </>,
                  <>{timeToLocaleString(employee.officeStartTime)}</>,
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
                  <>{timeToLocaleString(employee.officeEndTime)}</>,
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
                    {(employee.taskWisePayment && attendance.tasks) || 'N/A'}
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
                          employee?.attendances || []
                        ).find(({ id }) => id === attendance.id)
                        if (foundAttendance) {
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
                ])
              ),
            [] as JSX.Element[][]
          )}
        // FIXME: not clearing after deletion
        // rows={(attendanceDetails?.attendances || [])
      />

      <Modal isOpen={sidebar} setIsOpen={setSidebar}>
        <Modal.Header title='Update Attendance' close={toggleSidebar} />
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
          <h5 className='my-4' id='session-details'>
            Sessions
          </h5>
          <div className='col-12'>
            <Button
              disabled={isFetching}
              className='btn-primary'
              onClick={() =>
                setAttendance(attendance => ({
                  ...attendance,
                  sessions: [
                    ...attendance.sessions,
                    { ...defaultAttendanceSession }
                  ]
                }))
              }
            >
              Add New
            </Button>
          </div>
          <Table
            contCls='table-responsive'
            columns={['#', 'Arrival', 'Leave', 'Total Minutes', 'Action']}
            rows={attendance.sessions.map((session, idx) => [
              <>{idx + 1}</>,
              <input
                disabled={isFetching}
                type='time'
                className='form-control'
                value={session.arrivalTime}
                onChange={({ target: { value } }) =>
                  setAttendance(attendance => ({
                    ...attendance,
                    sessions: attendance.sessions.map((session, i) =>
                      i === idx
                        ? {
                            ...session,
                            arrivalTime: value,
                            sessionTime:
                              session.arrivalTime && session.leaveTime
                                ? Math.ceil(
                                    (timeToDate(session.leaveTime).getTime() -
                                      timeToDate(
                                        session.arrivalTime
                                      ).getTime()) /
                                      60000
                                  )
                                : 0
                          }
                        : session
                    )
                  }))
                }
              />,
              <input
                disabled={isFetching}
                type='time'
                className='form-control'
                value={session.leaveTime || ''}
                onChange={({ target: { value } }) =>
                  setAttendance(attendance => ({
                    ...attendance,
                    sessions: attendance.sessions.map((session, i) =>
                      i === idx
                        ? { ...session, leaveTime: value, sessionTime: 1 }
                        : session
                    )
                  }))
                }
              />,
              <input
                disabled={isFetching}
                type='number'
                className='form-control'
                value={session.sessionTime}
                onChange={({ target: { valueAsNumber } }) =>
                  setAttendance(attendance => {
                    const newAttendance = {
                      ...attendance,
                      sessions: attendance.sessions.map((session, i) =>
                        i === idx
                          ? { ...session, sessionTime: valueAsNumber }
                          : session
                      )
                    } satisfies EmployeeAttendance
                    newAttendance.totalTime = newAttendance.sessions.reduce(
                      (total, session) => total + session.sessionTime,
                      0
                    )
                    return newAttendance
                  })
                }
              />,
              <Button
                className='link-primary'
                disabled={isFetching}
                onClick={() =>
                  setAttendance(attendance => ({
                    ...attendance,
                    sessions: attendance.sessions.filter(s => s !== session)
                  }))
                }
              >
                <FaTrash />
              </Button>
            ])}
          />
          {(
            ['late', 'overtime', 'totalTime'] satisfies KeysOfObjectOfType<
              EmployeeAttendance,
              number
            >[]
          ).map(k => (
            <Input
              key={k}
              disabled={isFetching || attendance[k] === -1}
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

export default AttendanceTimesheet
