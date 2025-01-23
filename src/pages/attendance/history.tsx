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
import { defaultAttendance } from '../../constants/DEFAULT_MODELS'
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
            ({
              date,
              arrivalTime,
              leaveTime,
              overtime,
              late,
              totalTime,
              tasks
            }) => ({
              date,
              id: getEmployeeId(employee),
              employee: employee.name,
              designation: employee.designation.name,
              checkIn: arrivalTime, // TODO: fix
              checkOut: leaveTime,
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
        'checkIn',
        'checkOut',
        'late',
        'overtime',
        'tasks',
        'totalTime'
      ]
    }
  )

const AttendanceHistory = () => {
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

  return (
    <>
      <div className='align-items-center d-flex flex-wrap gap-2 justify-content-between mb-3'>
        <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
          <Button
            onClick={() =>
              downloadStringAsFile(
                getCsvFromAttendaces(attendances),
                'employeeAttendances.csv',
                { type: 'text/csv' }
              )
            }
            className='btn-primary'
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
      <Table
        columns={[
          'Date',
          'Employee',
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
                  </Link>,
                  <>{timeToLocaleString(attendance.arrivalTime)}</>,
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
                  <>{timeToLocaleString(attendance.leaveTime)}</>,
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

export default AttendanceHistory
