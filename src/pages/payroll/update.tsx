import { useMutation, useQuery } from '@tanstack/react-query'
import { type ChangeEventHandler, useContext, useState } from 'react'

import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import modifiedFetch from '../../libs/modifiedFetch'
import Select from '../../components/Select'
import {
  defaultDesignation,
  defaultEmployee
} from '../../constants/DEFAULT_MODELS'
import { BLANK_ARRAY } from '../../constants/CONSTANTS'

import type { GetResponseType } from 'backend/@types/response'
import type {
  allEmployees,
  updateEmployee
} from 'backend/controllers/employees'
import Employee from 'backend/Entities/Employee'
import { allDesignations } from 'backend/controllers/designations'
import Input from '../../components/Input'
import { capitalizeDelim } from '../../libs'
import Company from 'backend/Entities/Company'
import Designation from 'backend/Entities/Designation'
import Table from '../../components/Table'
import Button from '../../components/Button'

const UpdatePayroll = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [prevSalary, setPrevSalary] = useState(0)
  const [prevDesignation, setPrevDesignation] = useState({
    ...defaultDesignation
  })

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
      if (isNumeric)
        updatedEmployee.totalSalary =
          updatedEmployee.basicSalary +
          updatedEmployee.conveyance +
          updatedEmployee.foodCost +
          updatedEmployee.houseRent +
          updatedEmployee.medicalCost

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
      setPrevSalary(newEmployee?.totalSalary || 0)
      setPrevDesignation(newEmployee?.designation || defaultDesignation)
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
        refetchEmployees()
        refetchDesignations()
      }
    })

  const isFetching =
    _isFetching || isDesignationFetching || employeeUpdateLoading

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
              label: `${employee.eId}-${employee.name}`,
              value: employee.id
            }))}
            onChange={({ target: { value } }) => {
              const newEmployee = employees.find(
                employee => employee.id === parseInt(value)
              )
              setEmployee(employee => ({ ...(newEmployee || employee) }))
              setPrevSalary(newEmployee?.totalSalary || 0)
              setPrevDesignation(newEmployee?.designation || defaultDesignation)
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
            <div className='col-12 col-lg-6'>
              <Input
                disabled
                id='prevDesignation'
                label='Previous Designation'
                containerClass='my-3'
                value={employee.designation.name}
              />
            </div>

            <div className='col-12 col-lg-6'>
              <Input
                disabled
                id='currentSalary'
                label='Current Salary'
                containerClass='my-3'
                value={prevSalary}
              />
            </div>
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
                  disabled={isFetching || k === 'totalSalary'}
                  id={k}
                  label={'New ' + capitalizeDelim(k)}
                  placeholder={'Enter New ' + capitalizeDelim(k)}
                  containerClass='my-3'
                  value={employee[k]}
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
                  label={'New ' + capitalizeDelim(k)}
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
          'Previous Salary',
          'New Salary',
          'Prev. Designation',
          'New Designation',
          'Change Reason',
          'Date'
        ]}
        rows={[
          [
            <>{employee.eId}</>,
            <>{prevSalary}</>,
            <>{employee.totalSalary}</>,
            <>{prevDesignation.name}</>,
            <>{employee.designation.name}</>,
            <></>,
            <></>
          ]
        ]}
      />
    </>
  )
}

export default UpdatePayroll
