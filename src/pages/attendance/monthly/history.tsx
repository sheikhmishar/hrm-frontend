import { useMutation, useQuery } from '@tanstack/react-query'
import { useContext, useMemo, useState, type ChangeEventHandler } from 'react'
import { FaPen, FaTrash } from 'react-icons/fa6'

import Button from '../../../components/Button'
import CalenderSlider from '../../../components/CalenderDropdown'
import Input from '../../../components/Input'
import Modal from '../../../components/Modal'
import Table from '../../../components/Table'
import { BLANK_ARRAY } from '../../../constants/CONSTANTS'
import { defaultAttendance } from '../../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../../contexts/toast'
import { capitalizeDelim, getDateRange } from '../../../libs'
import modifiedFetch from '../../../libs/modifiedFetch'

import { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import EmployeeAttendance from 'backend/Entities/EmployeeAttendance'
import {
  allEmployeeAttendances,
  deleteEmployeeAttendance,
  updateEmployeeAttendance
} from 'backend/controllers/attendances'

const AttendanceHistory = () => {
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
        <div className='col-8'>
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
          'Action'
        ]}
        rows={attendances.reduce(
          (prev, employee) =>
            prev.concat(
              // FIXME: ?
              (employee.attendances || [])
                .map(attendance => {
                  const late = Math.ceil(
                    (new Date(
                      '2021-01-01T' + attendance.arrivalTime
                    ).getTime() -
                      new Date(
                        '2021-01-01T' + employee?.officeStartTime
                      ).getTime()) /
                      60000
                  )
                  const overtime = Math.ceil(
                    (new Date('2021-01-01T' + attendance.leaveTime).getTime() -
                      new Date(
                        '2021-01-01T' + employee?.officeEndTime
                      ).getTime()) /
                      60000
                  )
                  return {
                    ...attendance,
                    totalTime: Math.ceil(
                      (new Date(
                        '2021-01-01T' + attendance.leaveTime
                      ).getTime() -
                        new Date(
                          '2021-01-01T' + attendance.arrivalTime
                        ).getTime()) /
                        60000
                    ),
                    late: Math.max(0, late),
                    overtime: Math.max(0, overtime)
                  }
                })
                .map(attendance => [
                  <>{attendance.date}</>,
                  <>{employee?.name || ''}</>,
                  <>{employee?.designation.name || ''}</>,
                  <>{attendance.arrivalTime}</>,
                  <>{attendance.leaveTime}</>,
                  employee?.checkedInLateFee === 'inApplicable' ? (
                    <>'N/A'</>
                  ) : (
                    <>{attendance.late} minutes</>
                  ),
                  <>{attendance.overtime} minutes</>,
                  // TODO: check applicable
                  <>{attendance.tasks || 'N/A'}</>,
                  <>{attendance.totalTime} minutes</>,
                  <>
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
                  </>
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
