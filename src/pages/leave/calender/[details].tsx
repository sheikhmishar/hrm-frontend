import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ChangeEventHandler,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { FaArrowLeft, FaRotateLeft } from 'react-icons/fa6'
import { Link, useLocation, useParams } from 'react-router-dom'

import Button from '../../../components/Button'
import CalenderSlider from '../../../components/CalenderDropdown'
import Input from '../../../components/Input'
import Modal from '../../../components/Modal'
import Select, { DropDownEventHandler } from '../../../components/Select'
import { ROUTES } from '../../../constants/CONSTANTS'
import {
  defaultEmployee,
  defaultLeave
} from '../../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../../contexts/toast'
import generateCalender, {
  capitalizeDelim,
  getDateRange,
  getEmployeeId,
  getWeekData
} from '../../../libs'
import modifiedFetch from '../../../libs/modifiedFetch'

import { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import Employee from 'backend/Entities/Employee'
import EmployeeLeave from 'backend/Entities/EmployeeLeave'
import {
  addEmployeeLeave,
  employeeLeaveDetails
} from 'backend/controllers/leaves'
import { employeeDetails } from 'backend/controllers/employees'

const LeaveDetails = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const location = useLocation()
  const { month: monthFromQuery } = useMemo(
    () =>
      Object.fromEntries(new URLSearchParams(location.search)) as Partial<
        (typeof ROUTES)['leave']['_queries']
      >,
    [location.search]
  )

  const { id = '-1' } = useParams<(typeof ROUTES)['leave']['_params']>()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [leave, setLeave] = useState<EmployeeLeave>({
    ...defaultLeave,
    employee: { ...defaultLeave.employee, id: parseInt(id) }
  })
  const onLeaveChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setLeave(leave => ({ ...leave, [id]: value }))

  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { id, value } }) =>
      setLeave(leave =>
        (id as keyof EmployeeLeave) === 'employee'
          ? { ...leave, employee: { ...leave.employee, id: parseInt(value) } }
          : { ...leave, [id]: value }
      ),
    []
  )

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
  const toggleSidebar = () => setSidebar(sidebar => !sidebar)
  const resetData = () =>
    setLeave({
      ...defaultLeave,
      employee: { ...defaultLeave.employee, id: parseInt(id) }
    })

  const { data: employee, isFetching: employeeLoading } = useQuery({
    queryKey: ['employee', ServerSITEMAP.employees.getById, id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof employeeDetails>>(
        ServerSITEMAP.employees.getById.replace(
          ServerSITEMAP.employees._params.id,
          id
        )
      ),
    enabled: parseInt(id) > 0,
    onError: onErrorDisplayToast
  })

  const {
    data: leaveDetails,
    isFetching: _isFetching,
    refetch
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
          id || '-1'
        ) +
          '?' +
          new URLSearchParams({
            from: fromDateString,
            to: toDateString
          } satisfies Partial<typeof ServerSITEMAP.leaves._queries>)
      ),
    enabled: !!(id && id !== '-1'),
    retry: false
  })

  const { mutate: leaveCreate, isLoading: leaveCreateLoading } = useMutation({
    mutationKey: ['leaveCreate', ServerSITEMAP.leaves.post, leave],
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof addEmployeeLeave>>(
        ServerSITEMAP.leaves.post,
        {
          method: 'post',
          body: JSON.stringify(
            leave satisfies GetReqBodyType<typeof addEmployeeLeave>
          )
        }
      ),
    onError: onErrorDisplayToast,
    onSuccess: data => {
      data?.message && addToast(data.message)
      toggleSidebar()
      refetch()
    },
    retry: false
  })

  const isFetching = _isFetching || leaveCreateLoading || employeeLoading

  const calender = useMemo(
    () => generateCalender(fromDate, toDate),
    [fromDate, toDate]
  )
  const weekData = useMemo(
    () => getWeekData(fromDate, calender),
    [fromDate, calender]
  )

  return (
    <>
      <div className='align-items-center mb-3 row'>
        <div className='col-4'>
          <Link
            // TODO: add from
            to={ROUTES.leave.calender}
            className='link-primary text-decoration-none'
          >
            <FaArrowLeft /> Leave List
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

        <div className='col-4' />

        <div className='col-12 my-3'>
          <div className='border-0 card shadow-sm'>
            <div className='card-body'>
              <div className='d-flex'>
                <Button
                  disabled={isFetching}
                  className='btn-primary ms-auto my-2'
                  onClick={() => {
                    resetData()
                    toggleSidebar()
                  }}
                >
                  Apply for Leave
                </Button>
              </div>

              <div className='d-flex justify-content-end my-2'>
                <CalenderSlider
                  monthly
                  currentDate={currentDate}
                  setCurrentDate={setCurrentDate}
                />
              </div>

              <div className='d-flex justify-content-center my-2'>
                <table className='mt-3 table text-center w-75'>
                  <thead>
                    <tr>
                      <th>Sun</th>
                      <th>Mon</th>
                      <th>Tue</th>
                      <th>Wed</th>
                      <th>Thu</th>
                      <th>Fri</th>
                      <th>Sat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekData.map((week, i) => (
                      <tr key={i}>
                        {(() => {
                          console.log('START')
                          return <></>
                        })()}
                        {week.map((date, index) => {
                          const month =
                            (date < 15
                              ? toDate.getMonth()
                              : fromDate.getMonth()) + 1
                          const year =
                            month === 1
                              ? toDate.getFullYear()
                              : fromDate.getFullYear()
                          const targetDate =
                            date !== -1
                              ? new Date(
                                  `${year}-${month
                                    .toString()
                                    .padStart(2, '0')}-${date
                                    .toString()
                                    .padStart(2, '0')}`
                                )
                              : undefined
                          const leaveData = leaveDetails?.leaves.find(
                            ({ from, to }) =>
                              targetDate &&
                              new Date(from) <= targetDate &&
                              new Date(to) >= targetDate
                          )

                          return (
                            <td
                              key={index}
                              className={
                                leaveData
                                  ? leaveData.type === 'paid'
                                    ? 'bg-primary text-white '
                                    : 'bg-warning text-white'
                                  : ''
                              }
                            >
                              {date !== -1 ? date : ''}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={sidebar} setIsOpen={setSidebar}>
        <Modal.Header title='Add Leave' close={toggleSidebar} />
        <Modal.Body>
          {(
            ['employee'] satisfies KeysOfObjectOfType<EmployeeLeave, Employee>[]
          ).map(k => (
            <Select
              key={k}
              id={k}
              disabled
              autoComplete='true'
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={leave[k].id}
              options={[employee || defaultEmployee].map(employee => ({
                value: employee.id,
                label: `${getEmployeeId(employee)} - ${employee.name}`
              }))}
            />
          ))}
          {(
            ['from', 'to'] satisfies KeysOfObjectOfType<EmployeeLeave, string>[]
          ).map(k => (
            <Input
              key={k}
              disabled={isFetching}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              type='date'
              value={leave[k]}
              onChange={onLeaveChange}
            />
          ))}
          {(
            ['duration'] satisfies KeysOfObjectOfType<EmployeeLeave, string>[]
          ).map(k => (
            <Select
              key={k}
              id={k}
              disabled={isFetching}
              autoComplete='true'
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={leave[k]}
              options={(
                ['fullday', 'halfday'] satisfies EmployeeLeave[typeof k][]
              ).map(name => ({ value: name, label: name }))}
              onChange={onSelectChange}
            />
          ))}
          {(['type'] satisfies KeysOfObjectOfType<EmployeeLeave, string>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={isFetching}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={leave[k]}
                options={(
                  ['paid', 'unpaid'] satisfies EmployeeLeave[typeof k][]
                ).map(name => ({ value: name, label: name }))}
                onChange={onSelectChange}
              />
            )
          )}
          {(
            ['reason'] satisfies KeysOfObjectOfType<EmployeeLeave, string>[]
          ).map(k => (
            <Input
              key={k}
              disabled={isFetching}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={leave[k]}
              onChange={onLeaveChange}
            />
          ))}
          {(
            ['status'] satisfies KeysOfObjectOfType<EmployeeLeave, string>[]
          ).map(k => (
            <Select
              key={k}
              id={k}
              disabled={isFetching}
              autoComplete='true'
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={leave[k]}
              options={(
                ['approved', 'pending'] satisfies EmployeeLeave[typeof k][]
              ).map(name => ({ value: name, label: name }))}
              onChange={onSelectChange}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            <Button className='btn-light mx-2' onClick={resetData}>
              <FaRotateLeft />
            </Button>
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={isFetching}
              className='btn-primary mx-2'
              onClick={() => leaveCreate()}
            >
              <span className='align-items-center d-flex'>
                {leave.id > 0 ? 'Update' : 'Add'}
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

export default LeaveDetails
// TODO: details
