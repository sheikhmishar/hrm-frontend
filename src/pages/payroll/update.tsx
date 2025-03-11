import { useMutation, useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
import { useContext, useEffect, useState, type ChangeEventHandler } from 'react'
import { useParams } from 'react-router-dom'

import Button from '../../components/Button'
import Input from '../../components/Input'
import ProtectedComponent from '../../components/ProtectedComponent'
import Select from '../../components/Select'
import Table from '../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../constants/CONSTANTS'
import { defaultEmployee } from '../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import {
  capitalizeDelim,
  downloadStringAsFile,
  encodeMultipartBody,
  getEmployeeId,
  splitGrossSalary
} from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import type { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import type Company from 'backend/Entities/Company'
import type Designation from 'backend/Entities/Designation'
import type Employee from 'backend/Entities/Employee'
import type EmployeeSalary from 'backend/Entities/EmployeeSalary'
import type { allDesignations } from 'backend/controllers/designations'
import type {
  allEmployees,
  updateEmployee
} from 'backend/controllers/employees'
import type { employeeSalaryDetails } from 'backend/controllers/salaries'

const getCsvFromSalaries = (
  employee: Employee,
  salaryHistory: EmployeeSalary[]
) =>
  Papa.unparse(
    [
      ['Salary Update History'],
      [],
      [
        'Name: ' + employee.name,
        'Designation: ' + employee.designation.name,
        'Company: ' + employee.company.name
      ],
      [
        'Id: ' + getEmployeeId(employee),
        'Department: ' + employee.department.name,
        'DOJ: ' + employee.dateOfJoining
      ],
      []
    ].concat(
      [
        [
          'Sl.No',
          'Basic Salary',
          'House Rent',
          'Food Cost',
          'Conveyance',
          'Medical Cost',
          'Gross Salary',
          'TaskWise Payment',
          'Word Limit',
          'Remarks',
          'Designation',
          'Changed At'
        ]
      ].concat(
        salaryHistory.map((salary, i) =>
          [
            i + 1,
            salary.basicSalary,
            salary.houseRent,
            salary.foodCost,
            salary.conveyance,
            salary.medicalCost,
            salary.totalSalary,
            salary.taskWisePayment,
            salary.wordLimit,
            salary.remarks,
            salary.designation.name,
            new Date(salary.changedAt)
          ].map(v => v?.toString() || '')
        )
      )
    )
  )

const UpdatePayroll = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [employee, setEmployee] = useState<Employee>({ ...defaultEmployee })
  const onEmployeeChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value, valueAsNumber }
  }) =>
    setEmployee(employee => {
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
        [id]: isNumeric ? valueAsNumber : value
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

  const { id: idFromParam = '-1' } =
    useParams<(typeof ROUTES)['payroll']['_params']>()

  useEffect(() => {
    setEmployee(employee => ({ ...employee, id: parseInt(idFromParam) || -1 }))
  }, [idFromParam])

  const {
    refetch: refetchEmployees,
    data: employees = BLANK_ARRAY,
    isFetching: _isFetching
  } = useQuery({
    queryKey: ['employees', ServerSITEMAP.employees.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployees>>(
        ServerSITEMAP.employees.get
      ),
    onError: onErrorDisplayToast,
    onSuccess: data => {
      const newEmployee = data?.find(e => e.id === employee.id)
      setEmployee(() => ({ ...(newEmployee || defaultEmployee) }))
    }
  })

  const {
    refetch: refetchDesignations,
    data: designations = BLANK_ARRAY,
    isFetching: isDesignationFetching
  } = useQuery({
    queryKey: ['designations', ServerSITEMAP.designations.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allDesignations>>(
        ServerSITEMAP.designations.get
      ),
    onError: onErrorDisplayToast
  })

  const {
    refetch: refetchSalaryHistory,
    data: salaryHistory = BLANK_ARRAY,
    isFetching: isSalaryHistoryFetching
  } = useQuery({
    queryKey: [
      'salaryHistory',
      ServerSITEMAP.salaries.getByEmployeeId,
      employee.id
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof employeeSalaryDetails>>(
        ServerSITEMAP.salaries.getByEmployeeId.replace(
          ServerSITEMAP.salaries._params.employeeId,
          employee.id.toString()
        )
      ),
    enabled: employee.id > 0
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
          {
            method: 'put',
            body: encodeMultipartBody(
              employee satisfies GetReqBodyType<typeof updateEmployee>
            )
          }
        ),
      retry: false,
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        refetchEmployees()
        refetchDesignations()
        refetchSalaryHistory()
      }
    })

  const isFetching =
    _isFetching ||
    isDesignationFetching ||
    isSalaryHistoryFetching ||
    employeeUpdateLoading

  return (
    <>
      <div className='border-0 card mb-3 shadow-sm'>
        <div className='card-body'>
          <Select
            id='employeeId'
            disabled={isFetching}
            autoComplete='true'
            label='Employee Id'
            containerClass='my-3'
            required
            placeholder='Enter Employee ID'
            value={employee.id}
            options={employees
              .filter(({ status }) => status === 'active')
              .map(employee => ({
                label: `${getEmployeeId(employee)}-${employee.name}`,
                value: employee.id
              }))}
            onChange={({ target: { value } }) => {
              const newEmployee = employees.find(
                employee => employee.id === parseInt(value)
              )
              setEmployee(employee => ({ ...(newEmployee || employee) }))
            }}
          />

          <div className='row'>
            {(['name'] satisfies KeysOfObjectOfType<Employee, string>[]).map(
              k => (
                <div key={k} className='col-12 col-lg-6'>
                  <Input
                    disabled
                    id={k}
                    label={capitalizeDelim(k)}
                    containerClass='my-3'
                    value={employee[k]}
                  />
                </div>
              )
            )}
            {(
              ['company', 'department'] satisfies KeysOfObjectOfType<
                Employee,
                Company
              >[]
            ).map(k => (
              <div key={k} className='col-12 col-lg-6'>
                <Input
                  disabled
                  id={k}
                  label={capitalizeDelim(k)}
                  containerClass='my-3'
                  value={employee[k].name}
                />
              </div>
            ))}

            {(
              [
                'totalSalary',
                'basicSalary',
                'conveyance',
                'foodCost',
                'houseRent',
                'medicalCost'
              ] satisfies KeysOfObjectOfType<Employee, number>[]
            ).map(k => (
              <div key={k} className='col-12 col-lg-6'>
                <Input
                  disabled={isFetching}
                  id={k}
                  label={
                    k === 'totalSalary' ? 'Gross Salary' : capitalizeDelim(k)
                  }
                  placeholder={'Enter ' + capitalizeDelim(k)}
                  containerClass='my-3'
                  value={employee[k]}
                  type='number'
                  onChange={onEmployeeChange}
                />
              </div>
            ))}
            {(
              ['wordLimit', 'taskWisePayment'] satisfies KeysOfObjectOfType<
                Employee,
                number | undefined
              >[]
            ).map(k => (
              <div key={k} className='col-12 col-lg-6'>
                <Input
                  disabled={isFetching}
                  id={k}
                  label={capitalizeDelim(k)}
                  placeholder={'Enter ' + capitalizeDelim(k)}
                  containerClass='my-3'
                  value={employee[k] || ''}
                  type='number'
                  onChange={onEmployeeChange}
                />
              </div>
            ))}
            {(
              ['designation'] satisfies KeysOfObjectOfType<
                Employee,
                Designation
              >[]
            ).map(k => (
              <div key={k} className='col-12 col-lg-6'>
                <Select
                  id={k}
                  disabled={isFetching}
                  autoComplete='true'
                  label={capitalizeDelim(k)}
                  required
                  containerClass='my-3'
                  placeholder={'Enter ' + capitalizeDelim(k)}
                  value={employee[k].id}
                  options={
                    designations?.map(({ id, name }) => ({
                      value: id,
                      label: name
                    })) || []
                  }
                  onChange={({ target: { value } }) =>
                    setEmployee(employee => ({
                      ...employee,
                      designation: {
                        ...employee.designation,
                        id: parseInt(value) || -1
                      }
                    }))
                  }
                />
              </div>
            ))}
            {(
              ['remarks'] satisfies KeysOfObjectOfType<
                GetReqBodyType<typeof updateEmployee>,
                string | undefined
              >[]
            ).map(k => (
              <div key={k} className='col-12 col-lg-6'>
                <Input
                  disabled={isFetching}
                  id={k}
                  label={capitalizeDelim(k)}
                  placeholder={'Enter ' + capitalizeDelim(k)}
                  containerClass='my-3'
                  // @ts-expect-error // FIXME:
                  value={employee[k] || ''}
                  onChange={onEmployeeChange}
                />
              </div>
            ))}

            <hr className='mt-3' />
            <div className='col-12 d-flex my-2'>
              <Button
                onClick={() => employeeUpdate()}
                className='btn-primary ms-auto'
              >
                Save
              </Button>
              <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
                <Button
                  disabled={!salaryHistory.length}
                  onClick={() =>
                    downloadStringAsFile(
                      getCsvFromSalaries(employee, salaryHistory),
                      'employeeSalaryHistory.csv',
                      { type: 'text/csv' }
                    )
                  }
                  className='btn-primary ms-2'
                >
                  Export CSV
                </Button>
              </ProtectedComponent>
            </div>
          </div>
        </div>
      </div>

      <Table
        columns={[
          'Sl.No',
          'Basic Salary',
          'House Rent',
          'Food Cost',
          'Conveyance',
          'Medical Cost',
          'Gross Salary',
          'TaskWise Payment',
          'Word Limit',
          'Remarks',
          'Designation',
          'Changed At'
        ]}
        rows={salaryHistory.map((salary, i) => [
          <>{i + 1}</>,
          <>{salary.basicSalary}</>,
          <>{salary.houseRent}</>,
          <>{salary.foodCost}</>,
          <>{salary.conveyance}</>,
          <>{salary.medicalCost}</>,
          <>{salary.totalSalary}</>,
          <>{salary.taskWisePayment}</>,
          <>{salary.wordLimit}</>,
          <>{salary.remarks}</>,
          <>{salary.designation.name}</>,
          <>{new Date(salary.changedAt).toString()}</>
        ])}
      />
    </>
  )
}

export default UpdatePayroll
