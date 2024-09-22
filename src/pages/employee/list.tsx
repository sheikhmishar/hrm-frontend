import { useMutation, useQuery } from '@tanstack/react-query'
import {
  useCallback,
  useContext,
  useState,
  type ChangeEventHandler
} from 'react'

import { FaPen, FaPlus, FaRotateLeft } from 'react-icons/fa6'

import Button from '../../components/Button'
import Input from '../../components/Input'
import Select, { type DropDownEventHandler } from '../../components/Select'
import Modal from '../../components/Modal'
import Table from '../../components/Table'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import { capitalize, capitalizeDelim } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type Employee from 'backend/Entities/Employee'
import type { allBranches } from 'backend/controllers/branches'
import type { allCompanies } from 'backend/controllers/companies'
import type { allDepartments } from 'backend/controllers/departments'
import type { allDesignations } from 'backend/controllers/designations'
import type { allDutyTypes } from 'backend/controllers/duty-types'
import type {
  addEmployee,
  allEmployees,
  employeeDetails,
  updateEmployee
} from 'backend/controllers/employees'
import type { allSalaryTypes } from 'backend/controllers/salary-types'
import Department from 'backend/Entities/Department'
import Branch from 'backend/Entities/Branch'
import Company from 'backend/Entities/Company'
import Designation from 'backend/Entities/Designation'
import DutyType from 'backend/Entities/DutyType'
import SalaryType from 'backend/Entities/SalaryType'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/CONSTANTS'

const defaultDepartment: Department = {
  id: -1,
  name: '',
  status: 'active'
}
const defaultBranch: Branch = { ...defaultDepartment }
const defaultDesignation: Designation = { ...defaultDepartment }
const defaultDutyType: DutyType = { ...defaultDepartment }
const defaultSalaryType: SalaryType = { ...defaultDepartment }
const defaultCompany: Company = {
  ...defaultDepartment,
  logo: '',
  status: 'active',
  employees: []
}

const defaultEmployee: Employee = {
  id: -1,
  photo: '',
  eId: '',
  name: '',
  phoneNumber: '',
  altPhoneNumber: '',
  email: '',
  dateOfBirth: '',
  fullAddress: '',
  gender: 'Male',
  company: defaultCompany,
  department: defaultDepartment,
  branch: defaultBranch,
  designation: defaultDesignation,
  dutyType: defaultDutyType,
  salaryType: defaultSalaryType,
  dateOfJoining: new Date().toISOString().split('T')[0]!,
  unitSalary: 0,
  taskWisePayment: undefined,
  wordLimit: undefined,
  officeStartTime: '12:00',
  officeEndTime: '16:00',
  checkedInLateFee: 'inApplicable',
  overtime: 'inApplicable',
  noticePeriod: undefined,
  extraBonus: 'inApplicable',
  status: 'active',
  createdDate: new Date(),
  assets: [],
  contacts: [],
  financials: []
}

const visibleKeys = (Object.keys(defaultEmployee) as (keyof Employee)[]).filter(
  k =>
    k === 'eId' ||
    k === 'name' ||
    k === 'phoneNumber' ||
    k === 'email' ||
    k === 'photo' ||
    k === 'company' ||
    k === 'department'
) as (keyof Pick<
  Employee,
  'eId' | 'name' | 'phoneNumber' | 'email' | 'photo' | 'company' | 'department'
>)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const EmployeePage = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [employee, setEmployee] = useState<Employee>({
    ...defaultEmployee
  })
  const onEmployeeChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setEmployee(employee => ({ ...employee, [id]: value }))

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setEmployee(employee => ({ ...employee, id: -1 }))
      return !sidebar
    })

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const resetData = () => setEmployee({ ...defaultEmployee })

  const {
    refetch: refetchEmployees,
    data: employees,
    isFetching
  } = useQuery({
    queryKey: ['employees', ServerSITEMAP.employees.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployees>>(
        ServerSITEMAP.employees.get
      ),
    onError: onErrorDisplayToast
  })

  const {
    refetch: refetchCompanies,
    data: companies,
    isFetching: isFetchingCompanies
  } = useQuery({
    queryKey: ['companies', ServerSITEMAP.companies.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allCompanies>>(
        ServerSITEMAP.companies.get
      ),
    onError: onErrorDisplayToast
  })
  const {
    refetch: refetchDepartments,
    data: departments,
    isFetching: isFetchingDepartments
  } = useQuery({
    queryKey: ['departments', ServerSITEMAP.departments.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allDepartments>>(
        ServerSITEMAP.departments.get
      ),
    onError: onErrorDisplayToast
  })
  const {
    refetch: refetchBranches,
    data: branches,
    isFetching: isFetchingBranches
  } = useQuery({
    queryKey: ['branches', ServerSITEMAP.branches.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allBranches>>(
        ServerSITEMAP.branches.get
      ),
    onError: onErrorDisplayToast
  })
  const {
    refetch: refetchDesignations,
    data: designations,
    isFetching: isFetchingDesignations
  } = useQuery({
    queryKey: ['designations', ServerSITEMAP.designations.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allDesignations>>(
        ServerSITEMAP.designations.get
      ),
    onError: onErrorDisplayToast
  })
  const {
    refetch: refetchDutyTypes,
    data: dutyTypes,
    isFetching: isFetchingDutyTypes
  } = useQuery({
    queryKey: ['dutytypes', ServerSITEMAP.dutyTypes.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allDutyTypes>>(
        ServerSITEMAP.dutyTypes.get
      ),
    onError: onErrorDisplayToast
  })
  const {
    refetch: refetchSalaryTypes,
    data: salaryTypes,
    isFetching: isFetchingSalaryTypes
  } = useQuery({
    queryKey: ['salaryTypes', ServerSITEMAP.salaryTypes.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allSalaryTypes>>(
        ServerSITEMAP.salaryTypes.get
      ),
    onError: onErrorDisplayToast
  })

  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { id, value } }) =>
      setEmployee(employee => {
        const key = id as keyof Employee
        const valueAsInt = parseInt(value)
        if (key === 'company')
          return {
            ...employee,
            [key]: companies?.find(company => company.id === valueAsInt) || {
              ...defaultCompany
            }
          }

        if (key === 'department')
          return {
            ...employee,
            [key]: departments?.find(
              department => department.id === valueAsInt
            ) || { ...defaultDepartment }
          }
        if (key === 'branch')
          return {
            ...employee,
            [key]: branches?.find(branch => branch.id === valueAsInt) || {
              ...defaultBranch
            }
          }
        if (key === 'designation')
          return {
            ...employee,
            [key]: designations?.find(
              designation => designation.id === valueAsInt
            ) || { ...defaultDesignation }
          }
        if (key === 'dutyType')
          return {
            ...employee,
            [key]: dutyTypes?.find(dutyType => dutyType.id === valueAsInt) || {
              ...defaultDutyType
            }
          }
        if (key === 'salaryType')
          return {
            ...employee,
            [key]: salaryTypes?.find(
              salaryType => salaryType.id === valueAsInt
            ) || { ...defaultSalaryType }
          }

        return { ...employee, [id]: value }
      }),
    [companies, departments, branches, designations, dutyTypes, salaryTypes]
  )

  const { isFetching: employeeLoading } = useQuery({
    queryKey: ['employee', ServerSITEMAP.employees.getById, employee.id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof employeeDetails>>(
        ServerSITEMAP.employees.getById.replace(
          ServerSITEMAP.employees._params.id,
          employee.id.toString()
        )
      ),
    enabled: employee.id > 0,
    onError: onErrorDisplayToast,
    onSuccess: employee => employee && setEmployee(employee)
  })

  const { mutate: employeeUpdate, isLoading: employeeUpdateLoading } =
    useMutation({
      mutationKey: ['employeeUpdate', ServerSITEMAP.employees.put, employee],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof updateEmployee>>(
          ServerSITEMAP.employees.put.replace(
            ServerSITEMAP.employees._params.id,
            employee.id.toString()
          ),
          { method: 'put', body: JSON.stringify(employee) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchEmployees()
        refetchEmployees()
        refetchCompanies()
        refetchDepartments()
        refetchBranches()
        refetchDesignations()
        refetchDutyTypes()
        refetchSalaryTypes()
      }
    })

  const { mutate: employeeCreate, isLoading: employeeCreateLoading } =
    useMutation({
      mutationKey: ['employeeCreate', ServerSITEMAP.employees.post, employee],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof addEmployee>>(
          ServerSITEMAP.employees.post,
          { method: 'post', body: JSON.stringify(employee) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchEmployees()
        refetchCompanies()
        refetchDepartments()
        refetchBranches()
        refetchDesignations()
        refetchDutyTypes()
        refetchSalaryTypes()
      }
    })

  const isEmployeeLoading =
    employeeLoading ||
    isFetchingCompanies ||
    isFetchingDepartments ||
    isFetchingBranches ||
    isFetchingDesignations ||
    isFetchingDutyTypes ||
    isFetchingSalaryTypes

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>Employee</strong>
            </h4>
            <span className='text-primary'>Details</span>
          </div>
          {isFetching && (
            <div className='ms-3 spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          )}
          <div className='ms-auto w-25'>
            <input
              className='form-control py-2 rounded-3'
              id='search'
              placeholder='Search here'
              onChange={onSearchInputChange}
              value={search}
            />
          </div>
          <div>
            <Link to={ROUTES.employee.details}>+</Link>
            <Button
              onClick={() => {
                toggleSidebar()
                resetData()
              }}
              className='btn-primary ms-2'
            >
              Add New <FaPlus />
            </Button>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        rows={(employees || [])
          .filter(employee =>
            visibleKeys.find(key =>
              employee[key]
                ?.toString()
                .toLowerCase()
                .includes(search.toLowerCase())
            )
          )
          .map(employee =>
            visibleKeys
              .map(key => (
                <>
                  {key === 'company' || key === 'department'
                    ? employee[key].name
                    : employee[key]?.toString()?.substring?.(0, 50) +
                      ((employee[key]?.toString().length || 0) > 50
                        ? '...'
                        : '')}
                </>
              ))
              .concat(
                <Button
                  className='border-0 link-primary text-body'
                  onClick={() => {
                    setEmployee(d => ({ ...d, id: employee.id }))
                    toggleSidebar()
                  }}
                >
                  <FaPen />
                </Button>
              )
          )}
      />

      <Modal isOpen={sidebar} setIsOpen={setSidebar}>
        <Modal.Header
          title={`${employee.id === -1 ? 'Add' : 'Update'} Employee`}
          close={toggleSidebar}
        />
        <Modal.Body>
          {(
            [
              'eId',
              'name',
              'phoneNumber',
              'fullAddress'
            ] satisfies KeysOfObjectOfType<Employee, string>[]
          ).map(k => (
            <Input
              key={k}
              disabled={isEmployeeLoading}
              id={k}
              label={capitalizeDelim(k)}
              required
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={employee[k]}
              onChange={onEmployeeChange}
            />
          ))}
          {(
            ['altPhoneNumber'] satisfies KeysOfObjectOfType<
              Employee,
              string | undefined
            >[]
          ).map(k => (
            <Input
              key={k}
              disabled={isEmployeeLoading}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={employee[k]}
              onChange={onEmployeeChange}
            />
          ))}
          {(['email'] satisfies KeysOfObjectOfType<Employee, string>[]).map(
            k => (
              <Input
                key={k}
                disabled={isEmployeeLoading}
                id={k}
                label={capitalizeDelim(k)}
                required
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={employee[k]}
                type='email'
                onChange={onEmployeeChange}
              />
            )
          )}
          {(
            ['dateOfBirth', 'dateOfJoining'] satisfies KeysOfObjectOfType<
              Employee,
              string
            >[]
          ).map(k => (
            <Input
              key={k}
              disabled={isEmployeeLoading}
              id={k}
              label={capitalizeDelim(k)}
              required
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={employee[k]}
              type='date'
              onChange={onEmployeeChange}
            />
          ))}
          {(
            ['noticePeriod'] satisfies KeysOfObjectOfType<
              Employee,
              string | undefined
            >[]
          ).map(k => (
            <Input
              key={k}
              disabled={isEmployeeLoading}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={employee[k]}
              type='date'
              onChange={onEmployeeChange}
            />
          ))}
          {(['gender'] satisfies KeysOfObjectOfType<Employee, string>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={isEmployeeLoading}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                required
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={employee[k]}
                options={(
                  ['Male', 'Female', 'Others'] satisfies Employee[typeof k][]
                ).map(name => ({ value: name, label: name }))}
                onChange={onSelectChange}
              />
            )
          )}
          {(['status'] satisfies KeysOfObjectOfType<Employee, string>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={isEmployeeLoading}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                required
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={employee[k]}
                options={(
                  ['active', 'inactive'] satisfies Employee[typeof k][]
                ).map(name => ({ value: name, label: name }))}
                onChange={onSelectChange}
              />
            )
          )}

          {(
            [
              'department',
              'branch',
              'company',
              'designation',
              'dutyType',
              'salaryType'
            ] satisfies KeysOfObjectOfType<
              Employee,
              | Department
              | Branch
              | Company
              | Designation
              | DutyType
              | SalaryType
            >[]
          ).map(k => (
            <Select
              key={k}
              id={k}
              disabled={isEmployeeLoading}
              autoComplete='true'
              label={capitalizeDelim(k)}
              required
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={employee[k].id}
              options={
                (k === 'branch'
                  ? branches
                  : k === 'company'
                  ? companies
                  : k === 'department'
                  ? departments
                  : k === 'designation'
                  ? designations
                  : k === 'dutyType'
                  ? dutyTypes
                  : salaryTypes
                )?.map(({ id, name }) => ({ value: id, label: name })) || []
              }
              onChange={onSelectChange}
            />
          ))}
          {(
            [
              'checkedInLateFee',
              'overtime',
              'extraBonus'
            ] satisfies KeysOfObjectOfType<Employee, string>[]
          ).map(k => (
            <Select
              key={k}
              id={k}
              disabled={isEmployeeLoading}
              autoComplete='true'
              label={capitalizeDelim(k)}
              containerClass='my-3'
              required
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={employee[k]}
              options={(
                ['applicable', 'inApplicable'] satisfies Employee[typeof k][]
              ).map(name => ({ value: name, label: name }))}
              onChange={onSelectChange}
            />
          ))}

          {(
            ['officeStartTime', 'officeEndTime'] satisfies KeysOfObjectOfType<
              Employee,
              string
            >[]
          ).map(k => (
            <Input
              key={k}
              disabled={isEmployeeLoading}
              id={k}
              label={capitalizeDelim(k)}
              required
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={employee[k]}
              type='time'
              onChange={onEmployeeChange}
            />
          ))}

          {(
            [
              'unitSalary',
              'taskWisePayment',
              'wordLimit'
            ] satisfies KeysOfObjectOfType<Employee, number | undefined>[]
          ).map(k => (
            <Input
              key={k}
              disabled={isEmployeeLoading}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={employee[k]}
              type='number'
              onChange={onEmployeeChange}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            {employee.id === -1 && (
              <Button className='btn-light mx-2' onClick={resetData}>
                <FaRotateLeft />
              </Button>
            )}
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={
                isEmployeeLoading ||
                employeeCreateLoading ||
                employeeUpdateLoading
              }
              className='btn-primary mx-2'
              onClick={() =>
                employee.id > 0 ? employeeUpdate() : employeeCreate()
              }
            >
              <span className='align-items-center d-flex'>
                {employee.id > 0 ? 'Update' : 'Add'}
                {(isEmployeeLoading ||
                  employeeCreateLoading ||
                  employeeUpdateLoading) && (
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

export default EmployeePage
