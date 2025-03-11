import { useMutation, useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
import { useContext, useMemo, useState, type ChangeEventHandler } from 'react'
import { FaPen, FaPlus } from 'react-icons/fa6'
import { Link } from 'react-router-dom'

import Button from '../../components/Button'
import EmployeeName from '../../components/EmployeeName'
import ProtectedComponent from '../../components/ProtectedComponent'
import Table from '../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../constants/CONSTANTS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../contexts/auth'
import { ToastContext } from '../../contexts/toast'
import {
  capitalize,
  downloadStringAsFile,
  encodeMultipartBody,
  getEmployeeId
} from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import type { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import type Employee from 'backend/Entities/Employee'
import type {
  allEmployees,
  updateEmployee
} from 'backend/controllers/employees'

const visibleKeys = [
  'name',
  'phoneNumber',
  'company',
  'department',
  'status'
] satisfies (keyof Employee)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const getCsvFromEmployees = (employees: Employee[]) =>
  Papa.unparse(
    employees.map(
      ({
        id,
        email,
        name,
        phoneNumber,
        dateOfJoining,
        assets,
        basicSalary,
        branch: { name: branch },
        dutyType: { name: dutyType },
        salaryType: { name: salaryType },
        department: { name: department },
        company: { name: company },
        designation: { name: designation },
        checkedInLateFee,
        contacts,
        conveyance,
        createdDate,
        dateOfBirth,
        extraBonus,
        financials,
        foodCost,
        fullAddress,
        gender,
        houseRent,
        medicalCost,
        officeEndTime,
        officeStartTime,
        overtime,
        status,
        totalSalary,
        loanTaken,
        loanRemaining,
        altPhoneNumber,
        noticePeriod,
        noticePeriodRemark,
        photo,
        taskWisePayment,
        wordLimit
      }) =>
        ({
          id: getEmployeeId({ id, dateOfJoining }), // TODO: use globals
          email,
          name,
          phoneNumber,
          branch,
          dutyType,
          salaryType,
          company,
          department,
          basicSalary,
          checkedInLateFee,
          conveyance,
          createdDate: createdDate.toString(),
          dateOfBirth,
          dateOfJoining,
          designation,
          extraBonus,
          financialHolderName:
            financials[financials.length - 1]?.holderName || '',
          financialMedium: financials[financials.length - 1]?.medium || '',
          financialAccountNumber:
            financials[financials.length - 1]?.accountNumber || '',
          financialBankName: financials[financials.length - 1]?.bankName || '',
          financialBranch: financials[financials.length - 1]?.branch || '',
          foodCost,
          fullAddress,
          gender,
          houseRent,
          medicalCost,
          officeEndTime,
          officeStartTime,
          overtime,
          status,
          totalSalary,
          grossSalary:
            basicSalary + foodCost + houseRent + conveyance + medicalCost,
          loanTaken,
          loanRemaining,
          altPhoneNumber,
          noticePeriod,
          noticePeriodRemark,
          photo,
          taskWisePayment,
          wordLimit,
          assets: assets.map(({ name }) => name).join(', '),
          contacts: contacts
            .map(
              ({ name, phoneNo, relation }) => `${name}-${phoneNo}-${relation}`
            )
            .join(', ')
        } satisfies {
          [k in keyof OmitKey<
            Employee & {
              grossSalary: number
              financialHolderName: string
              financialMedium: string
              financialAccountNumber: string
              financialBankName: string
              financialBranch: string
            },
            | 'attendances'
            | 'leaves'
            | 'salaries'
            | 'loans'
            | 'documents'
            | 'financials'
          >]: string | number | undefined
        })
    ),
    {
      columns: ['id' satisfies keyof Employee]
        .concat(visibleKeys as string[])
        .concat([
          'altPhoneNumber',
          'fullAddress',
          'gender',
          'contacts',
          'basicSalary',
          'houseRent',
          'foodCost',
          'medicalCost',
          'conveyance',
          'grossSalary',
          'totalSalary',
          'loanTaken',
          'loanRemaining',
          'taskWisePayment',
          'wordLimit',
          'checkedInLateFee',
          'extraBonus',
          'createdDate',
          'dateOfBirth',
          'dateOfJoining',
          'conveyance',
          'dutyType',
          'designation',
          'branch',
          'financialHolderName',
          'financialMedium',
          'financialAccountNumber',
          'financialBankName',
          'financialBranch',
          'noticePeriod',
          'noticePeriodRemark',
          'officeStartTime',
          'officeEndTime',
          'overtime',
          'salaryType',
          'assets'
        ] satisfies (
          | keyof OmitKey<
              Employee,
              | (typeof visibleKeys)[number]
              | 'attendances'
              | 'leaves'
              | 'salaries'
              | 'financials'
            >
          | 'grossSalary'
          | 'financialHolderName'
          | 'financialMedium'
          | 'financialAccountNumber'
          | 'financialBankName'
          | 'financialBranch'
        )[])
    }
  )

const EmployeePage: React.FC<{ approval?: boolean }> = ({ approval }) => {
  const { onErrorDisplayToast, addToast } = useContext(ToastContext)
  const { self } = useContext(AuthContext)

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const {
    refetch,
    data: _employees = BLANK_ARRAY,
    isFetching: fetchingEmployees
  } = useQuery({
    queryKey: ['employees', ServerSITEMAP.employees.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployees>>(
        ServerSITEMAP.employees.get
      ),
    onError: onErrorDisplayToast
  })

  const { mutate: employeeUpdate, isLoading: employeeUpdateLoading } =
    useMutation({
      mutationKey: ['employeeUpdate', ServerSITEMAP.employees.put],
      mutationFn: ({
        id,
        employee
      }: {
        id: number
        employee: Partial<Employee>
      }) =>
        modifiedFetch<GetResponseType<typeof updateEmployee>>(
          ServerSITEMAP.employees.put.replace(
            ServerSITEMAP.employees._params.id,
            id.toString()
          ),
          {
            method: 'put',
            body: encodeMultipartBody(
              employee satisfies GetReqBodyType<typeof updateEmployee>
            )
          }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        refetch()
      }
    })

  const employees = useMemo(
    () =>
      _employees.filter(
        employee =>
          (approval
            ? employee.status === 'inactive'
            : employee.status === 'active') &&
          (!(self?.type === 'Employee' && self.employeeId) ||
            employee.id === self.employeeId) &&
          (visibleKeys.find(key =>
            (key === 'company' || key === 'department'
              ? employee[key].name
              : employee[key]
            )
              .toString()
              .toLowerCase()
              .includes(search.toLowerCase())
          ) ||
            getEmployeeId(employee).includes(search))
      ),
    [_employees, approval, search, self?.employeeId, self?.type]
  )

  const isFetching = fetchingEmployees || employeeUpdateLoading

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
            <Button
              onClick={() =>
                downloadStringAsFile(
                  getCsvFromEmployees(employees),
                  'employees.csv',
                  { type: 'text/csv' }
                )
              }
              className='btn-primary'
            >
              Export CSV
            </Button>
          </ProtectedComponent>
          {isFetching && (
            <div className='ms-3 spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          )}
          <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
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
              <Link
                role='button'
                className='btn btn-primary ms-2'
                to={ROUTES.employee.details.replace(
                  ROUTES.employee._params.id,
                  '-1'
                )}
              >
                Add New <FaPlus />
              </Link>
            </div>
          </ProtectedComponent>
        </div>
      </div>
      <Table
        columns={columns}
        rows={employees.map(employee =>
          visibleKeys
            .map(key =>
              key === 'name' ? (
                <Link
                  className='text-decoration-none'
                  to={ROUTES.employee.details.replace(
                    ROUTES.employee._params.id,
                    employee.id.toString()
                  )}
                >
                  <EmployeeName employee={employee} />
                </Link>
              ) : key === 'department' || key === 'company' ? (
                <>{employee[key].name}</>
              ) : key === 'status' ? (
                <span
                  className={`p-1 rounded ${
                    approval
                      ? 'text-bg-danger bg-opacity-50'
                      : 'text-bg-primary'
                  }`}
                  role='button'
                  onClick={() =>
                    approval
                      ? employeeUpdate({
                          id: employee.id,
                          employee: { status: 'active' }
                        })
                      : employeeUpdate({
                          id: employee.id,
                          employee: { status: 'inactive' }
                        })
                  }
                >
                  {employee[key]}
                </span>
              ) : (
                // TODO: global
                <>
                  {employee[key]?.toString().substring(0, 50) +
                    ((employee[key]?.toString().length || 0) > 50 ? '...' : '')}
                </>
              )
            )
            .concat(
              <Link
                role='button'
                className='link-primary text-body'
                to={ROUTES.employee.details.replace(
                  ROUTES.employee._params.id,
                  employee.id.toString()
                )}
              >
                <FaPen />
              </Link>
            )
        )}
      />
    </>
  )
}

export default EmployeePage
