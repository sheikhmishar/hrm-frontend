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

import Button from '../../../components/Button'
import CalenderSlider from '../../../components/CalenderDropdown'
import Input from '../../../components/Input'
import Modal from '../../../components/Modal'
import Table from '../../../components/Table'
import { ROUTES } from '../../../constants/CONSTANTS'
import { defaultAttendance } from '../../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../../contexts/toast'
import { capitalizeDelim, getDateRange } from '../../../libs'
import modifiedFetch from '../../../libs/modifiedFetch'

import { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import EmployeeAttendance from 'backend/Entities/EmployeeAttendance'
import {
  deleteEmployeeAttendance,
  employeeAttendanceDetails,
  updateEmployeeAttendance
} from 'backend/controllers/attendances'

const AttendanceDetails = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const location = useLocation()
  const { month: monthFromQuery } = useMemo(
    () =>
      Object.fromEntries(new URLSearchParams(location.search)) as Partial<
        (typeof ROUTES)['attendance']['_queries']
      >,
    [location.search]
  )

  const { id = '-1' } = useParams<(typeof ROUTES)['attendance']['_params']>()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendance, setAttendance] = useState<EmployeeAttendance>({
    ...defaultAttendance
  })
  const onAttendanceChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setAttendance(attendance => ({ ...attendance, [id]: value }))

  useEffect(
    () => setCurrentDate(new Date(monthFromQuery || currentDate)),
    [monthFromQuery]
  )

  const [fromDate, toDate] = useMemo(
    () => getDateRange(currentDate),
    [currentDate]
  )
  const [fromDateString, toDateString] = useMemo(
    () =>
      [fromDate, toDate].map(date => date.toISOString().split('T')[0]) as [
        string,
        string
      ],
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
          id || '-1'
        ) +
          '?' +
          new URLSearchParams({
            from: fromDateString,
            to: toDateString
          } satisfies Partial<typeof ServerSITEMAP.attendances._queries>)
      ),
    enabled: !!(id && id !== '-1'),
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
        'updateEmployeAattendance',
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
        'deleteEmployeAattendance',
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
      <div className='align-items-center mb-3 row'>
        <div className='col-4'>
          <Link
            // TODO: add from
            to={ROUTES.attendance.monthly}
            className='link-primary text-decoration-none'
          >
            <FaArrowLeft /> Attendance List
          </Link>
        </div>
        <div className='col-4'>
          {_isFetching && (
            <div
              className='ms-2 spinner-border spinner-border-sm text-light'
              role='status'
            >
              <span className='visually-hidden'>Loading...</span>
            </div>
          )}
        </div>

        <div className='col-4 d-flex justify-content-end'>
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
          'Designation',
          'Check In',
          'Check Out',
          'Late',
          'Overtime',
          'Tasks',
          'Total Time',
          'Status',
          'Action'
        ]}
        // FIXME: not clearing after deletion
        rows={(attendanceDetails?.attendances || []).map(attendance => [
          <>{attendance.date}</>,
          <>{attendanceDetails?.name || ''}</>,
          <>{attendanceDetails?.designation.name || ''}</>,
          <>{attendance.arrivalTime}</>,
          <>{attendance.leaveTime}</>,
          <>
            {attendance.late === -1 ? 'N/A' : Math.max(0, attendance.late)}{' '}
            minutes
          </>,
          <>
            {attendance.overtime === -1
              ? 'N/A'
              : Math.max(0, attendance.overtime)}{' '}
            minutes
          </>,
          // TODO: check applicable
          <>{attendance.tasks || 'N/A'}</>,
          <>{attendance.totalTime} minutes</>,
          <>
            <span
              className={
                attendance.late === 0
                  ? 'text-bg-warning'
                  : attendance.late < 0
                  ? 'text-bg-success'
                  : 'text-bg-danger'
              }
            >
              {attendance.late === 0
                ? 'In time'
                : attendance.late < 0
                ? 'Early In'
                : 'Late In'}
            </span>
            |
            <span
              className={
                attendance.overtime === 0
                  ? 'text-bg-warning'
                  : attendance.overtime < 0
                  ? 'text-bg-danger'
                  : 'text-bg-success'
              }
            >
              {attendance.overtime === 0
                ? 'On time'
                : attendance.overtime < 0
                ? 'Early Out'
                : 'Late Out'}
            </span>
          </>,
          <>
            <Button
              disabled={isFetching}
              onClick={() => {
                // FIXME ||[]
                const foundAttendance = (
                  attendanceDetails?.attendances || []
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
          </>
        ])}
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
            ['tasks'] satisfies KeysOfObjectOfType<
              EmployeeAttendance,
              string | undefined
            >[]
          ).map(k => (
            <Input
              key={k}
              // disabled={attendanceLoading}
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
