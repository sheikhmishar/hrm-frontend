import { useMutation, useQuery } from '@tanstack/react-query'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ChangeEventHandler
} from 'react'
import { FaRotateLeft, FaTrash } from 'react-icons/fa6'

import Button from '../../components/Button'
import CalenderSlider from '../../components/CalenderDropdown'
import Input from '../../components/Input'
import Modal from '../../components/Modal'
import Select, { DropDownEventHandler } from '../../components/Select'
import Table from '../../components/Table'
import { BLANK_ARRAY } from '../../constants/CONSTANTS'
import { defaultLeave } from '../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import { capitalizeDelim, getDateRange, getEmployeeId } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import Employee from 'backend/Entities/Employee'
import EmployeeLeave from 'backend/Entities/EmployeeLeave'
import { allCompanies } from 'backend/controllers/companies'
import { allEmployees } from 'backend/controllers/employees'
import {
  addEmployeeLeave,
  allEmployeeLeaves,
  deleteEmployeeLeave
} from 'backend/controllers/leaves'

const Assigned = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [companyId, setCompanyId] = useState(-1)

  const [leave, setLeave] = useState<EmployeeLeave>({ ...defaultLeave })
  const [currentDate, setCurrentDate] = useState(new Date())

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

  useEffect(() => setCurrentDate(new Date(fromDateString)), [fromDateString])

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

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setLeave(leave => ({ ...leave, id: -1 }))
      return !sidebar
    })
  const resetData = () => setLeave({ ...defaultLeave })

  const {
    data: employeeLeaves = BLANK_ARRAY,
    isFetching: fetchingLeaves,
    refetch
  } = useQuery({
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

  const {
    data: employees = BLANK_ARRAY,
    isFetching: fetchingEmployees,
    refetch: refetchEmployees
  } = useQuery({
    queryKey: ['employee', ServerSITEMAP.employees.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployees>>(
        ServerSITEMAP.employees.get
      ),
    onError: onErrorDisplayToast
  })
  const {
    refetch: refetchCompanies,
    data: companies = BLANK_ARRAY,
    isFetching: fetchingCompanies
  } = useQuery({
    queryKey: ['companies', ServerSITEMAP.companies.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allCompanies>>(
        ServerSITEMAP.companies.get
      ),
    onError: onErrorDisplayToast
  })
  const { isLoading, mutate } = useMutation({
    mutationFn: (id: number) =>
      modifiedFetch<GetResponseType<typeof deleteEmployeeLeave>>(
        ServerSITEMAP.leaves.delete.replace(
          ServerSITEMAP.leaves._params.id,
          id.toString()
        ),
        { method: 'delete' }
      ),
    mutationKey: ['deleteEmployeeLeave', ServerSITEMAP.leaves.delete],
    onSuccess: data => {
      data?.message && addToast(data.message)
      refetch()
      refetchCompanies()
      refetchEmployees()
    },
    onError: onErrorDisplayToast,
    retry: false
  })

  const { mutate: leaveCreate, isLoading: leaveCreateLoading } = useMutation({
    mutationKey: ['leaveCreate', ServerSITEMAP.leaves.post, leave],
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof addEmployeeLeave>>(
        ServerSITEMAP.leaves.post,
        { method: 'post', body: JSON.stringify(leave) }
      ),
    onError: onErrorDisplayToast,
    onSuccess: data => {
      data?.message && addToast(data.message)
      toggleSidebar()
      refetch()
    },
    retry: false
  })

  const isFetching =
    fetchingLeaves ||
    fetchingCompanies ||
    fetchingEmployees ||
    leaveCreateLoading

  return (
    <>
      <div className='mb-3 row'>
        <div className='col-4 col-lg-3'>
          <CalenderSlider
            monthly
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          />
        </div>
        <div className='col-3 col-lg-4'>
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
        <div className='col-2'>
          {isFetching && (
            <div className='ms-3 spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          )}
        </div>
        <div className='col-3 d-flex'>
          <Button
            onClick={() => {
              toggleSidebar()
              resetData()
            }}
            className='btn-primary ms-auto'
          >
            + Add leave
          </Button>
        </div>
      </div>

      <Table
        columns={[
          'Employee',
          'Company',
          'From',
          'To',
          'Duration',
          'Total days',
          'Leave Type',
          'Leave status',
          'Action'
        ]}
        rows={employeeLeaves
          .filter(({ company: { id } }) => companyId < 1 || id === companyId)
          .reduce(
            (prev, employee) =>
              prev.concat(
                // FIXME: undefined
                employee.leaves?.map(leave => [
                  <div className='align-items-center align-middle d-flex gap-3 p-3'>
                    <img
                      src='/favicon.png'
                      width='50'
                      height='50'
                      className='object-fit-cover rounded-circle'
                    />
                    <div>
                      <p className='m-0'>{employee.name}</p>
                      {getEmployeeId(employee)}
                    </div>
                  </div>,
                  <>{employee.company.name}</>,
                  <>{leave.from}</>,
                  <>{leave.to}</>,
                  <>{leave.duration}</>,
                  <>
                    {((new Date(leave.to).getTime() -
                      new Date(leave.from).getTime()) /
                      (3600000 * 24) +
                      1) *
                      (leave.duration === 'fullday' ? 1 : 0.5)}
                  </>,
                  <>{leave.type}</>,
                  <>{leave.status}</>,
                  <Button
                    disabled={isLoading}
                    onClick={() => mutate(leave.id)}
                    className='link-primary text-body'
                  >
                    <FaTrash />
                  </Button>
                ])
              ),
            [] as JSX.Element[][]
          )}
      />

      <Modal isOpen={sidebar} setIsOpen={setSidebar}>
        <Modal.Header title='Add Leave' close={toggleSidebar} />
        <Modal.Body>
          {(
            ['employee'] satisfies KeysOfObjectOfType<EmployeeLeave, Employee>[]
          ).map(k => (
            <Select
              key={k}
              id={k}
              disabled={isFetching}
              autoComplete='true'
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={leave[k].id}
              options={employees.map(employee => ({
                value: employee.id,
                label: `${getEmployeeId(employee)} - ${employee.name}`
              }))}
              onChange={onSelectChange}
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
            {leave.id === -1 && (
              <Button className='btn-light mx-2' onClick={resetData}>
                <FaRotateLeft />
              </Button>
            )}
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

export default Assigned
