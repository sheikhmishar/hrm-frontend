import { useMutation, useQuery } from '@tanstack/react-query'
import { useContext, useState, type ChangeEventHandler } from 'react'

import Button from '../../components/Button'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Table from '../../components/Table'
import { BLANK_ARRAY } from '../../constants/CONSTANTS'
import { defaultEmployee } from '../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import { capitalizeDelim, encodeMultipartBody, getEmployeeId, splitGrossSalary } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import type { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import Company from 'backend/Entities/Company'
import Designation from 'backend/Entities/Designation'
import Employee from 'backend/Entities/Employee'
import { allDesignations } from 'backend/controllers/designations'
import type {
  allEmployees,
  updateEmployee
} from 'backend/controllers/employees'
import { employeeSalaryDetails } from 'backend/controllers/salaries'

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
            options={employees.map(employee => ({
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
                  label={capitalizeDelim(k)}
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
            <div className='col-12 col-lg-6'>
              <Input id='reason' label='Change Reason' containerClass='my-3' />
            </div>

            <hr className='mt-3' />
            <div className='col-12 d-flex my-2'>
              <Button
                onClick={() => employeeUpdate()}
                className='btn-primary ms-auto'
              >
                Save
              </Button>
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
          'Total Salary',
          'TaskWise Payment',
          'Word Limit',
          'Designation',
          'Date'
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
          <>{salary.designation.name}</>,
          <>{new Date(salary.changedAt).toDateString()}</>
        ])}
      />
    </>
  )
}

export default UpdatePayroll
