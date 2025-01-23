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
import CalenderSlider from '../../../components/CalenderSlider'
import Input from '../../../components/Input'
import Modal from '../../../components/Modal'
import ProtectedComponent from '../../../components/ProtectedComponent'
import Select, { DropDownEventHandler } from '../../../components/Select'
import { ROUTES } from '../../../constants/CONSTANTS'
import {
  defaultEmployee,
  defaultLeave
} from '../../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../../contexts/auth'
import { ToastContext } from '../../../contexts/toast'
import generateCalender, {
  capitalizeDelim,
  getDateRange,
  dateToString,
  getEmployeeId,
  getWeekData,
  stringToDate
} from '../../../libs'
import modifiedFetch from '../../../libs/modifiedFetch'

import { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import Employee from 'backend/Entities/Employee'
import EmployeeLeave from 'backend/Entities/EmployeeLeave'
import { employeeDetails } from 'backend/controllers/employees'
import {
  addEmployeeLeave,
  employeeLeaveDetails
} from 'backend/controllers/leaves'

const LeaveDetails = () => {
  const { self } = useContext(AuthContext)
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const location = useLocation()
  const { month: monthFromQuery } = useMemo(
    () =>
      Object.fromEntries(new URLSearchParams(location.search)) as Partial<
        (typeof ROUTES)['leave']['_queries']
      >,
    [location.search]
  )

  const [id, setId] = useState(-1)
  const { id: idFromParam = '-1' } =
    useParams<(typeof ROUTES)['leave']['_params']>()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [leave, setLeave] = useState<EmployeeLeave>({
    ...defaultLeave,
    employee: { ...defaultLeave.employee, id }
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

  useEffect(() => {
    if (self?.type === 'Employee' && self.employeeId) setId(self.employeeId)
    else setId(parseInt(idFromParam) || -1)
  }, [self, idFromParam])

  useEffect(
    () =>
      setCurrentDate(currentDate =>
        stringToDate(monthFromQuery || currentDate.toDateString())
      ),
    [monthFromQuery]
  )

  const [fromDate, toDate] = useMemo(
    () => getDateRange(currentDate),
    [currentDate]
  )
  const [fromDateString, toDateString] = useMemo(
    () => [fromDate, toDate].map(dateToString) as [string, string],
    [fromDate, toDate]
  )

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () => setSidebar(sidebar => !sidebar)
  const resetData = () =>
    setLeave({
      ...defaultLeave,
      employee: { ...defaultLeave.employee, id }
    })

  const { data: employee, isFetching: employeeLoading } = useQuery({
    queryKey: ['employee', ServerSITEMAP.employees.getById, id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof employeeDetails>>(
        ServerSITEMAP.employees.getById.replace(
          ServerSITEMAP.employees._params.id,
          id.toString()
        )
      ),
    enabled: id > 0,
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
          id.toString()
        ) +
          '?' +
          new URLSearchParams({
            from: fromDateString,
            to: toDateString
          } satisfies Partial<typeof ServerSITEMAP.leaves._queries>)
      ),
    enabled: id > 0,
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
            <div className='ms-3 spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          )}
        </div>

        <div className='col-4' />

        <div className='col-12 my-3'>
          <div className='border-0 card shadow-sm'>
            <div className='card-body'>
              <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
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
              </ProtectedComponent>

              <div className='d-flex justify-content-end my-2'>
                <CalenderSlider
                  monthly
                  currentDate={currentDate}
                  setCurrentDate={setCurrentDate}
                />
              </div>

              <div className='container text-center'>
                <div className='row'>
                  <div className='col-12'>
                    <h5 className='text-muted'>Paid Leave</h5>
                    <hr />
                  </div>
                  <div className='col-6 mb-3'>
                    <div className='bg-light p-2 rounded'>
                      <h5 className='fw-bold text-primary'>Allowed in Year</h5>
                      <h3 className='fw-bold mb-0'>13</h3>
                    </div>
                  </div>
                  <div className='col-6 mb-3'>
                    <div className='bg-light p-2 rounded'>
                      <h5 className='fw-bold text-primary'>Allowed in Month</h5>
                      <h3 className='fw-bold mb-0'>3</h3>
                    </div>
                  </div>
                  <div className='col-6 mb-3'>
                    <div className='bg-light p-2 rounded'>
                      <h5 className='fw-bold text-primary'>Taken in Year</h5>
                      <h3 className='fw-bold mb-0'>
                        {leaveDetails?.employeePaidLeaveInYear || 0}
                      </h3>
                    </div>
                  </div>
                  <div className='col-6 mb-3'>
                    <div className='bg-light p-2 rounded'>
                      <h5 className='fw-bold text-primary'>Taken in Month</h5>
                      <h3 className='fw-bold mb-0'>
                        {leaveDetails?.employeeLeave?.leaves
                          .filter(leave => leave.type === 'paid')
                          .reduce(
                            (total, leave) => total + leave.totalDays,
                            0
                          ) || 0}
                      </h3>
                    </div>
                  </div>
                  <div className='col-6 mb-3'>
                    <div className='bg-light p-2 rounded'>
                      <h5 className='fw-bold text-primary'>
                        Remaining in Year
                      </h5>
                      <h3 className='fw-bold mb-0'>
                        {13 - (leaveDetails?.employeePaidLeaveInYear || 0)}
                      </h3>
                    </div>
                  </div>
                  <div className='col-6 mb-3'>
                    <div className='bg-light p-2 rounded'>
                      <h5 className='fw-bold text-primary'>
                        Remaining in Month
                      </h5>
                      <h3 className='fw-bold mb-0'>
                        {/* TODO: totalPaidDays */}
                        {3 -
                          (leaveDetails?.employeeLeave?.leaves
                            .filter(leave => leave.type === 'paid')
                            .reduce(
                              (total, leave) => total + leave.totalDays,
                              0
                            ) || 0)}
                      </h3>
                    </div>
                  </div>
                </div>
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
                              ? new Date(year, month - 1, date)
                              : undefined
                          const leaveData =
                            leaveDetails?.employeeLeave?.leaves.find(
                              ({ from, to }) =>
                                targetDate &&
                                stringToDate(from) <= targetDate &&
                                stringToDate(to) >= targetDate
                            )

                          return (
                            <td
                              key={index}
                              className={
                                leaveData
                                  ? (leaveData.type === 'paid'
                                      ? leaveData.duration === 'first_halfday'
                                        ? 'bg-top-half-primary'
                                        : leaveData.duration ===
                                          'second_halfday'
                                        ? 'bg-bottom-half-primary'
                                        : 'bg-primary'
                                      : leaveData.duration === 'first_halfday'
                                      ? 'bg-top-half-secondary'
                                      : leaveData.duration === 'second_halfday'
                                      ? 'bg-bottom-half-secondary'
                                      : 'bg-secondary') + ' text-white'
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
              min={fromDateString}
              max={toDateString}
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
                [
                  'fullday',
                  'first_halfday',
                  'second_halfday'
                ] satisfies EmployeeLeave[typeof k][]
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
