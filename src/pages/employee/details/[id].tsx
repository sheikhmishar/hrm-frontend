import { useMutation, useQuery } from '@tanstack/react-query'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler
} from 'react'
import { BsArrowLeftShort } from 'react-icons/bs'
import { FaRotateLeft, FaTrash } from 'react-icons/fa6'
import {
  Link,
  LinkProps,
  useLocation,
  useNavigate,
  useParams
} from 'react-router-dom'

import Button from '../../../components/Button'
import Input from '../../../components/Input'
import ProtectedComponent from '../../../components/ProtectedComponent'
import Select, { DropDownEventHandler } from '../../../components/Select'
import Table from '../../../components/Table'
import { ROUTES } from '../../../constants/CONSTANTS'
import {
  defaultAsset,
  defaultBranch,
  defaultCompany,
  defaultContact,
  defaultDepartment,
  defaultDesignation,
  defaultDutyType,
  defaultEmployee,
  defaultFinancial,
  defaultSalaryType
} from '../../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../../contexts/auth'
import { ToastContext } from '../../../contexts/toast'
import {
  capitalizeDelim,
  encodeMultipartBody,
  splitGrossSalary
} from '../../../libs'
import modifiedFetch from '../../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import Branch from 'backend/Entities/Branch'
import Company from 'backend/Entities/Company'
import Department from 'backend/Entities/Department'
import Designation from 'backend/Entities/Designation'
import DutyType from 'backend/Entities/DutyType'
import Employee from 'backend/Entities/Employee'
import SalaryType from 'backend/Entities/SalaryType'
import { allBranches } from 'backend/controllers/branches'
import { allCompanies } from 'backend/controllers/companies'
import { allDepartments } from 'backend/controllers/departments'
import { allDesignations } from 'backend/controllers/designations'
import { allDutyTypes } from 'backend/controllers/duty-types'
import {
  addEmployee,
  employeeDetails,
  updateEmployee
} from 'backend/controllers/employees'
import { allSalaryTypes } from 'backend/controllers/salary-types'

const ScrollLink: React.FC<LinkProps & { isFirst?: boolean }> = ({
  isFirst,
  children,
  ...props
}) => {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash === props.to.toString())
      document
        .querySelector(hash)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [hash, props.to])

  return (
    <Link
      {...props}
      role='button'
      className={`nav-link text-nowrap user-select-none ${
        hash === props.to.toString() || (isFirst && !hash)
          ? 'border-3 border-bottom border-primary'
          : ''
      }`}
    >
      {children}
    </Link>
  )
}

const EmployeeDetails = () => {
  const { self } = useContext(AuthContext)
  const { id: idFromRoute } =
    useParams<Partial<(typeof ROUTES)['employee']['_params']>>()
  const id =
    self?.type === 'Employee' ? self.employeeId || -1 : parseInt(idFromRoute)
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#noticePeriod')
      document.querySelector('#noticePeriod')?.scrollIntoView()
  }, [location])

  const { addToast, onErrorDisplayToast } = useContext(ToastContext)
  const navigate = useNavigate()
  const photoRef = useRef<HTMLInputElement>(null)

  const [employee, setEmployee] = useState<Employee>({ ...defaultEmployee })
  const onEmployeeChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value, valueAsNumber, files }
  }) =>
    setEmployee(employee => {
      const file = files?.item(0)
      const isNumeric = (
        [
          'basicSalary',
          'conveyance',
          'foodCost',
          'houseRent',
          'medicalCost',
          'totalSalary',
          'taskWisePayment',
          'wordLimit'
        ] satisfies KeysOfObjectOfType<
          Employee,
          number | undefined
        >[] as string[]
      ).includes(id)
      const updatedEmployee: Employee = {
        ...employee,
        [id]: isNumeric
          ? valueAsNumber
          : id === ('photo' satisfies keyof Employee) && file
          ? URL.createObjectURL(file)
          : value
      }

      if (isNumeric) {
        if ((id as keyof Employee) === 'totalSalary') {
          const { basic, conveyance, food, houseRent, medical } =
            splitGrossSalary(updatedEmployee.totalSalary)
          updatedEmployee.basicSalary = basic
          updatedEmployee.conveyance = conveyance
          updatedEmployee.foodCost = food
          updatedEmployee.houseRent = houseRent
          updatedEmployee.medicalCost = medical
        } else
          updatedEmployee.totalSalary =
            updatedEmployee.basicSalary +
            updatedEmployee.conveyance +
            updatedEmployee.foodCost +
            updatedEmployee.houseRent +
            updatedEmployee.medicalCost
      }

      return updatedEmployee
    })

  useEffect(() => {
    setEmployee(employee => ({ ...employee, id }))
  }, [id])

  const resetData = () => setEmployee({ ...defaultEmployee })

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

  const { refetch, isFetching: employeeLoading } = useQuery({
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
    onSuccess: employee => {
      if (employee) setEmployee(employee)
      if (photoRef.current) photoRef.current.value = ''
    }
  })

  const employeeFormData = useMemo(() => {
    const formData = encodeMultipartBody(employee)
    if (photoRef.current?.files?.[0])
      formData.append(
        'photo' satisfies keyof Employee,
        photoRef.current.files[0]
      )
    return formData
  }, [employee])

  const { mutate: employeeUpdate, isLoading: employeeUpdateLoading } =
    useMutation({
      mutationKey: ['employeeUpdate', ServerSITEMAP.employees.put, employee],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof updateEmployee>>(
          ServerSITEMAP.employees.put.replace(
            ServerSITEMAP.employees._params.id,
            employee.id.toString()
          ),
          {
            method: 'put',
            headers: { 'content-type': 'multipart/form-data' },
            body: employeeFormData
          }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        refetch()
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
          {
            method: 'post',
            headers: { 'content-type': 'multipart/form-data' },
            body: employeeFormData
          }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        refetchCompanies()
        refetchDepartments()
        refetchBranches()
        refetchDesignations()
        refetchDutyTypes()
        refetchSalaryTypes()
        navigate(
          ROUTES.employee.details.replace(
            ROUTES.employee._params.id,
            data?.data.employee?.id.toString() || '-1'
          )
        )
      }
    })

  const isEmployeeLoading =
    employeeLoading ||
    isFetchingCompanies ||
    isFetchingDepartments ||
    isFetchingBranches ||
    isFetchingDesignations ||
    isFetchingDutyTypes ||
    isFetchingSalaryTypes ||
    !!(self?.type === 'Employee' && self.employeeId)

  return (
    <>
      <Link
        role='button'
        className='btn mb-2 text-primary'
        to={ROUTES.employee.list}
      >
        <BsArrowLeftShort size={21} />
        Employee details
      </Link>

      <div className='row'>
        <div className='col-6 col-lg-4 rounded-3'>
          <div className='border-0 card rounded-3 sticky-top z-1'>
            <div className='card-body'>
              <div className='bg-primary-subtle mt-5 rounded-3 text-center w-100'>
                <img
                  className='bg-light object-fit-cover rounded-circle'
                  alt='profile-img'
                  src={
                    employee.photo
                      ? employee.photo.startsWith('blob:')
                        ? employee.photo
                        : import.meta.env.REACT_APP_BASE_URL +
                          ServerSITEMAP.static.employeePhotos +
                          '/' +
                          employee.photo
                      : '/favicon.png'
                  }
                  style={{ marginTop: '-3rem', height: 150, width: 150 }}
                />
                <h4 className='my-2'>{employee.name}</h4>
                <p className='text-muted'>Designation</p>
              </div>
              <div className='mt-4 row'>
                <div className='col-5'>
                  <span className='me-auto text-muted'>Employee</span>
                </div>
                <div className='col-7'>
                  <p className='mb-0 text-end'>{employee.name}</p>
                </div>
              </div>
              <div className='mt-4 row'>
                <div className='col-5'>
                  <span className='me-auto text-muted'>Phone Number</span>
                </div>
                <div className='col-7'>
                  <p className='mb-0 text-end'>{employee.phoneNumber}</p>
                </div>
              </div>
              <div className='mt-4 row'>
                <div className='col-5'>
                  <span className='me-auto text-muted'>Email Address</span>
                </div>
                <div className='col-7'>
                  <p className='mb-0 text-end'>{employee.email}</p>
                </div>
              </div>
              <div className='mt-4 row'>
                <div className='col-5'>
                  <span className='me-auto text-muted'>Date of Birth</span>
                </div>
                <div className='col-7'>
                  <p className='mb-0 text-end'>{employee.dateOfBirth}</p>
                </div>
              </div>
              <div className='mt-4 row'>
                <div className='col-5'>
                  <span className='me-auto text-muted'>Gender</span>
                </div>
                <div className='col-7'>
                  <p className='mb-0 text-end'>{employee.gender}</p>
                </div>
              </div>
              <div className='mt-4 row'>
                <div className='col-5'>
                  <span className='me-auto text-muted'>Address</span>
                </div>
                <div className='col-7'>
                  <p className='mb-0 text-end'>{employee.fullAddress}</p>
                </div>
              </div>
              <div className='mt-4 row'>
                <div className='col-5'>
                  <span className='me-auto text-muted'>Date of Joining</span>
                </div>
                <div className='col-7'>
                  <p className='mb-0 text-end'>{employee.dateOfJoining}</p>
                </div>
              </div>
              <div className='mt-4 row'>
                <div className='col-5'>
                  <span className='me-auto text-muted'>Company</span>
                </div>
                <div className='col-7'>
                  <p className='mb-0 text-end'>{employee.company.name}</p>
                </div>
              </div>
              <div className='mt-4 row'>
                <div className='col-5'>
                  <span className='me-auto text-muted'>Department</span>
                </div>
                <div className='col-7'>
                  <p className='mb-0 text-end'>{employee.department.name}</p>
                </div>
              </div>
              <div className='mt-4 row'>
                <div className='col-5'>
                  <span className='me-auto text-muted'>Duty Type</span>
                </div>
                <div className='col-7'>
                  <p className='mb-0 text-end'>{employee.dutyType.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='col-6 col-lg-8 rounded-3'>
          <div className='border-0 card rounded-3'>
            <div className='card-body'>
              <div className='bg-white border-bottom d-flex gap-3 justify-content-between overflow-x-auto py-2 sticky-top w-100 z-1'>
                <ScrollLink isFirst to='#personal-details'>
                  Personal Details
                </ScrollLink>
                <ScrollLink to='#corporate-details'>
                  Corporate Details
                </ScrollLink>
                <ScrollLink to='#documents'>Documents</ScrollLink>
                <ScrollLink to='#financial-details'>
                  Bank account details
                </ScrollLink>
                <ScrollLink to='#contacts'>Emmergency contact</ScrollLink>
                <ScrollLink to='#assets'>Allocated Asset</ScrollLink>
              </div>
              <h5 className='my-4' id='personal-details'>
                Personal details
              </h5>
              <div className='row'>
                {(
                  ['name', 'phoneNumber'] satisfies KeysOfObjectOfType<
                    Employee,
                    string
                  >[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
                      disabled={isEmployeeLoading}
                      id={k}
                      label={capitalizeDelim(k)}
                      required
                      containerClass='my-3'
                      placeholder={'Enter ' + capitalizeDelim(k)}
                      value={employee[k]}
                      onChange={onEmployeeChange}
                    />
                  </div>
                ))}
                {(
                  ['altPhoneNumber'] satisfies KeysOfObjectOfType<
                    Employee,
                    string | undefined
                  >[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
                      disabled={isEmployeeLoading}
                      id={k}
                      label={capitalizeDelim(k)}
                      containerClass='my-3'
                      placeholder={'Enter ' + capitalizeDelim(k)}
                      value={employee[k] || ''}
                      onChange={onEmployeeChange}
                    />
                  </div>
                ))}
                {(
                  ['email'] satisfies KeysOfObjectOfType<Employee, string>[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
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
                  </div>
                ))}
                {(
                  ['dateOfBirth'] satisfies KeysOfObjectOfType<
                    Employee,
                    string
                  >[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
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
                  </div>
                ))}
                {(
                  ['gender'] satisfies KeysOfObjectOfType<Employee, string>[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Select
                      id={k}
                      disabled={isEmployeeLoading}
                      autoComplete='true'
                      label={capitalizeDelim(k)}
                      containerClass='my-3'
                      required
                      placeholder={'Enter ' + capitalizeDelim(k)}
                      value={employee[k]}
                      options={(
                        [
                          'Male',
                          'Female',
                          'Others'
                        ] satisfies Employee[typeof k][]
                      ).map(name => ({ value: name, label: name }))}
                      onChange={onSelectChange}
                    />
                  </div>
                ))}
                {(
                  ['fullAddress'] satisfies KeysOfObjectOfType<
                    Employee,
                    string
                  >[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
                      disabled={isEmployeeLoading}
                      id={k}
                      label={capitalizeDelim(k)}
                      required
                      containerClass='my-3'
                      placeholder={'Enter ' + capitalizeDelim(k)}
                      value={employee[k]}
                      onChange={onEmployeeChange}
                    />
                  </div>
                ))}

                {(
                  ['photo'] satisfies KeysOfObjectOfType<
                    Employee,
                    string | undefined
                  >[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
                      ref={photoRef}
                      disabled={isEmployeeLoading}
                      id={k}
                      label={capitalizeDelim(k)}
                      containerClass='my-3'
                      placeholder={'Enter ' + capitalizeDelim(k)}
                      onChange={onEmployeeChange}
                      type='file'
                      accept='image/*'
                    />
                  </div>
                ))}

                <h5 className='my-4' id='corporate-details'>
                  Corporate details
                </h5>
                {(
                  [
                    'company',
                    'department',
                    'branch',
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
                  <div key={k} className='col-12 col-lg-6'>
                    <Select
                      id={k}
                      disabled={
                        isEmployeeLoading ||
                        (k === 'designation' && employee.id > 0)
                      }
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
                        )?.map(({ id, name }) => ({
                          value: id,
                          label: name
                        })) || []
                      }
                      onChange={onSelectChange}
                    />
                  </div>
                ))}
                {(
                  ['dateOfJoining'] satisfies KeysOfObjectOfType<
                    Employee,
                    string
                  >[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
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
                  </div>
                ))}
                {(
                  [
                    'basicSalary',
                    'conveyance',
                    'foodCost',
                    'houseRent',
                    'medicalCost',
                    'totalSalary'
                  ] satisfies KeysOfObjectOfType<Employee, number>[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
                      disabled={isEmployeeLoading || employee.id > 0}
                      id={k}
                      required
                      label={capitalizeDelim(k)}
                      containerClass='my-3'
                      placeholder={'Enter ' + capitalizeDelim(k)}
                      value={employee[k]}
                      type='number'
                      onChange={onEmployeeChange}
                    />
                  </div>
                ))}
                {(
                  ['taskWisePayment', 'wordLimit'] satisfies KeysOfObjectOfType<
                    Employee,
                    number | undefined
                  >[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
                      disabled={isEmployeeLoading || employee.id > 0}
                      id={k}
                      label={capitalizeDelim(k)}
                      containerClass='my-3'
                      placeholder={'Enter ' + capitalizeDelim(k)}
                      value={employee[k] || ''}
                      type='number'
                      onChange={onEmployeeChange}
                    />
                  </div>
                ))}
                {(
                  [
                    'officeStartTime',
                    'officeEndTime'
                  ] satisfies KeysOfObjectOfType<Employee, string>[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
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
                  </div>
                ))}
                {(
                  [
                    'checkedInLateFee',
                    'overtime',
                    'extraBonus'
                  ] satisfies KeysOfObjectOfType<Employee, string>[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Select
                      id={k}
                      disabled={isEmployeeLoading}
                      autoComplete='true'
                      label={capitalizeDelim(k)}
                      containerClass='my-3'
                      required
                      placeholder={'Enter ' + capitalizeDelim(k)}
                      value={employee[k]}
                      options={(
                        [
                          'applicable',
                          'inApplicable'
                        ] satisfies Employee[typeof k][]
                      ).map(name => ({ value: name, label: name }))}
                      onChange={onSelectChange}
                    />
                  </div>
                ))}
                {(
                  ['noticePeriod'] satisfies KeysOfObjectOfType<
                    Employee,
                    string | undefined
                  >[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
                      disabled={isEmployeeLoading}
                      id={k}
                      label='Last Working Day'
                      containerClass='my-3'
                      placeholder='Enter Last Working Day'
                      value={employee[k] || ''}
                      type='date'
                      onChange={onEmployeeChange}
                    />
                  </div>
                ))}
                {(
                  ['noticePeriodRemark'] satisfies KeysOfObjectOfType<
                    Employee,
                    string | undefined
                  >[]
                ).map(k => (
                  <div key={k} className='col-12 col-lg-6'>
                    <Input
                      disabled={isEmployeeLoading}
                      id={k}
                      label='Remark'
                      containerClass='my-3'
                      placeholder='Enter Remark'
                      value={employee[k] || ''}
                      onChange={onEmployeeChange}
                    />
                  </div>
                ))}

                <h5 className='my-4' id='financial-details'>
                  Financial details
                </h5>
                <div className='col-12'>
                  <Button
                    disabled={isEmployeeLoading}
                    className='btn-primary'
                    onClick={() =>
                      setEmployee(employee => ({
                        ...employee,
                        financials: [
                          ...employee.financials,
                          { ...defaultFinancial }
                        ]
                      }))
                    }
                  >
                    Add New
                  </Button>
                </div>
                <Table
                  contCls=' '
                  columns={[
                    'Sl.No',
                    'Holder Name',
                    'Medium',
                    'Account Number',
                    'Bank Name',
                    'Branch',
                    'Action'
                  ]}
                  rows={employee.financials.map((financial, idx) => [
                    <>{idx + 1}</>,
                    <input
                      disabled={isEmployeeLoading}
                      className='form-control'
                      value={financial.holderName}
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          financials: employee.financials.map((financial, i) =>
                            i === idx
                              ? { ...financial, holderName: value }
                              : financial
                          )
                        }))
                      }
                    />,
                    <input
                      disabled={isEmployeeLoading}
                      className='form-control'
                      value={financial.medium}
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          financials: employee.financials.map((financial, i) =>
                            i === idx
                              ? { ...financial, medium: value }
                              : financial
                          )
                        }))
                      }
                    />,
                    <input
                      disabled={isEmployeeLoading}
                      className='form-control'
                      value={financial.accountNumber}
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          financials: employee.financials.map((financial, i) =>
                            i === idx
                              ? { ...financial, accountNumber: value }
                              : financial
                          )
                        }))
                      }
                    />,
                    <input
                      disabled={isEmployeeLoading}
                      className='form-control'
                      value={financial.bankName}
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          financials: employee.financials.map((financial, i) =>
                            i === idx
                              ? { ...financial, bankName: value }
                              : financial
                          )
                        }))
                      }
                    />,
                    <input
                      disabled={isEmployeeLoading}
                      className='form-control'
                      value={financial.branch}
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          financials: employee.financials.map((financial, i) =>
                            i === idx
                              ? { ...financial, branch: value }
                              : financial
                          )
                        }))
                      }
                    />,
                    <Button
                      className='link-primary'
                      disabled={isEmployeeLoading}
                      onClick={() =>
                        setEmployee(employee => ({
                          ...employee,
                          financials: employee.financials.filter(
                            f => f !== financial
                          )
                        }))
                      }
                    >
                      <FaTrash />
                    </Button>
                  ])}
                />
                <h5 className='my-4' id='contacts'>
                  Contact details
                </h5>
                <div className='col-12'>
                  <Button
                    disabled={isEmployeeLoading}
                    className='btn-primary'
                    onClick={() =>
                      setEmployee(employee => ({
                        ...employee,
                        contacts: [...employee.contacts, { ...defaultContact }]
                      }))
                    }
                  >
                    Add New
                  </Button>
                </div>
                <Table
                  contCls=' '
                  columns={[
                    'Sl.No',
                    'Name',
                    'Phone Number',
                    'Relation',
                    'Action'
                  ]}
                  rows={employee.contacts.map((contact, idx) => [
                    <>{idx + 1}</>,
                    <input
                      disabled={isEmployeeLoading}
                      className='form-control'
                      value={contact.name}
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          contacts: employee.contacts.map((contact, i) =>
                            i === idx ? { ...contact, name: value } : contact
                          )
                        }))
                      }
                    />,
                    <input
                      disabled={isEmployeeLoading}
                      className='form-control'
                      value={contact.phoneNo}
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          contacts: employee.contacts.map((contact, i) =>
                            i === idx ? { ...contact, phoneNo: value } : contact
                          )
                        }))
                      }
                    />,
                    <input
                      // TODO: disable on
                      disabled={isEmployeeLoading}
                      className='form-control'
                      value={contact.relation}
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          contacts: employee.contacts.map((contact, i) =>
                            i === idx
                              ? { ...contact, relation: value }
                              : contact
                          )
                        }))
                      }
                    />,
                    <Button
                      className='link-primary'
                      disabled={isEmployeeLoading}
                      onClick={() =>
                        setEmployee(employee => ({
                          ...employee,
                          contacts: employee.contacts.filter(f => f !== contact)
                        }))
                      }
                    >
                      <FaTrash />
                    </Button>
                  ])}
                />

                <h5 className='my-4' id='assets'>
                  Allocated Assets
                </h5>
                <div className='col-12'>
                  <Button
                    disabled={isEmployeeLoading}
                    className='btn-primary'
                    onClick={() =>
                      setEmployee(employee => ({
                        ...employee,
                        assets: [...employee.assets, { ...defaultAsset }]
                      }))
                    }
                  >
                    Add New
                  </Button>
                </div>
                <Table
                  contCls=' '
                  columns={[
                    'Sl.No',
                    'Asset Name',
                    'Asset Description',
                    'Given',
                    'Return',
                    'Action'
                  ]}
                  rows={employee.assets.map((asset, idx) => [
                    <>{idx + 1}</>,
                    <input
                      disabled={isEmployeeLoading}
                      className='form-control'
                      value={asset.name}
                      // TODO: required optional
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          assets: employee.assets.map((asset, i) =>
                            i === idx ? { ...asset, name: value } : asset
                          )
                        }))
                      }
                    />,
                    <input
                      disabled={isEmployeeLoading}
                      className='form-control'
                      value={asset.description}
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          assets: employee.assets.map((asset, i) =>
                            i === idx ? { ...asset, description: value } : asset
                          )
                        }))
                      }
                    />,
                    <input
                      disabled={isEmployeeLoading}
                      className='form-control'
                      type='date'
                      value={asset.givenDate}
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          assets: employee.assets.map((asset, i) =>
                            i === idx ? { ...asset, givenDate: value } : asset
                          )
                        }))
                      }
                    />,
                    <input
                      disabled={isEmployeeLoading}
                      className='form-control'
                      value={asset.returnDate || ''}
                      type='date'
                      onChange={({ target: { value } }) =>
                        setEmployee(employee => ({
                          ...employee,
                          assets: employee.assets.map((asset, i) =>
                            i === idx ? { ...asset, returnDate: value } : asset
                          )
                        }))
                      }
                    />,
                    <Button
                      disabled={isEmployeeLoading}
                      className='link-primary'
                      onClick={() =>
                        setEmployee(employee => ({
                          ...employee,
                          assets: employee.assets.filter(f => f !== asset)
                        }))
                      }
                    >
                      <FaTrash />
                    </Button>
                  ])}
                />
              </div>

              {(
                ['status'] satisfies KeysOfObjectOfType<Employee, string>[]
              ).map(k => (
                <div key={k} className='col-12 col-lg-6'>
                  <Select
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
                </div>
              ))}
              <hr />
              <ProtectedComponent rolesAllowed={['HR', 'SuperAdmin']}>
                <div className='d-flex justify-content-end mt-3'>
                  {employee.id === -1 && (
                    <Button className='btn-light mx-2' onClick={resetData}>
                      <FaRotateLeft />
                    </Button>
                  )}
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
              </ProtectedComponent>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default EmployeeDetails

// TODO: change confirmation silo
