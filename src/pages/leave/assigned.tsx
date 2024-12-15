import { useMutation, useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
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
import CalenderSlider from '../../components/CalenderSlider'
import Input from '../../components/Input'
import Modal from '../../components/Modal'
import ProtectedComponent from '../../components/ProtectedComponent'
import Select, { DropDownEventHandler } from '../../components/Select'
import Table from '../../components/Table'
import { BLANK_ARRAY } from '../../constants/CONSTANTS'
import { defaultLeave } from '../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../contexts/auth'
import { ToastContext } from '../../contexts/toast'
import {
  capitalizeDelim,
  downloadStringAsFile,
  getDateRange,
  dateToString,
  getEmployeeId,
  dayDifference,
  stringToDate
} from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'
import EmployeeName from '../../components/EmployeeName'

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

const getCsvFromLeaves = (employees: Employee[]) =>
  Papa.unparse(
    employees.reduce(
      (prev, employee) =>
        prev.concat(
          employee.leaves.map(({ from, to, duration, type, status }) => ({
            employee: getEmployeeId(employee) + ' | ' + employee.name,
            company: employee.company.name,
            from,
            to,
            duration,
            totalDays:
              dayDifference(stringToDate(to), stringToDate(from)) *
              (duration === 'fullday' ? 1 : 0.5),
            leaveType: type,
            leaveStatus: status
          }))
        ),
      [] as { [x: string]: number | string }[]
    ),
    {
      columns: [
        'employee',
        'company',
        'from',
        'to',
        'duration',
        'totalDays',
        'leaveType',
        'leaveStatus'
      ]
    }
  )

const Assigned = () => {
  const { self } = useContext(AuthContext)
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [companyId, setCompanyId] = useState(-1)

  const [leave, setLeave] = useState<EmployeeLeave>({ ...defaultLeave })
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
    data: _employeeLeaves = BLANK_ARRAY,
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

  const employeeLeaves = useMemo(
    () =>
      _employeeLeaves.filter(
        ({ id, company: { id: cid } }) =>
          (companyId < 1 || cid === companyId) &&
          (self?.type === 'Employee' && self.employeeId
            ? id === self.employeeId
            : true)
      ),
    [_employeeLeaves, companyId, self]
  )

  return (
    <>
      <div className='align-items-center d-flex gap-2 justify-content-between mb-3'>
        <CalenderSlider
          monthly
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
        />
        <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
          <Button
            onClick={() =>
              downloadStringAsFile(
                getCsvFromLeaves(employeeLeaves),
                'employeeLeaves.csv',
                { type: 'text/csv' }
              )
            }
            className='btn-primary'
          >
            Export CSV
          </Button>

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
          {isFetching && (
            <div className='ms-3 spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          )}
          <Button
            onClick={() => {
              toggleSidebar()
              resetData()
            }}
            className='btn-primary ms-auto'
          >
            + Add leave
          </Button>
        </ProtectedComponent>
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
          .filter(
            ({ id, company: { id: cid } }) =>
              (companyId < 1 || cid === companyId) &&
              (self?.type === 'Employee' && self.employeeId
                ? id === self.employeeId
                : true)
          )
          .reduce(
            (prev, employee) =>
              prev.concat(
                // FIXME: undefined
                employee.leaves?.map(leave => [
                  <EmployeeName
                    employee={{
                      id: employee.id,
                      dateOfJoining: employee.dateOfJoining,
                      name: employee.name,
                      designation: employee.designation.name,
                      email: employee.email,
                      photo: employee.photo
                    }}
                  />,
                  <>{employee.company.name}</>,
                  <>{leave.from}</>,
                  <>{leave.to}</>,
                  <>{leave.duration}</>,
                  <>{leave.totalDays}</>,
                  <>{leave.type}</>,
                  <>{leave.status}</>,
                  <Button
                    disabled={isLoading || self?.type === 'Employee'}
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
              min={fromDateString}
              max={toDateString}
              // TODO: all
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
