import { useMutation, useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
import { useContext, useState, type ChangeEventHandler } from 'react'
import { FaPen, FaPlus } from 'react-icons/fa6'
import { Link } from 'react-router-dom'

import Button from '../../components/Button'
import ProtectedComponent from '../../components/ProtectedComponent'
import Table from '../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../constants/CONSTANTS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../contexts/auth'
import { ToastContext } from '../../contexts/toast'
import { capitalize, downloadStringAsFile, getEmployeeId } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import type { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import type Employee from 'backend/Entities/Employee'
import type {
  allEmployees,
  updateEmployee
} from 'backend/controllers/employees'

const visibleKeys = [
  'id',
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
        photo,
        taskWisePayment,
        wordLimit
      }) =>
        ({
          id:
            dateOfJoining.substring(0, 7) +
            '-' +
            id.toString().padStart(4, '0'), // TODO: use globals
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
          financials: financials
            .map(
              ({ accountNumber, bankName, branch, holderName, medium }) =>
                `${accountNumber} | ${bankName} | ${branch} | ${holderName} | ${medium}`
            )
            .join(', '),
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
            Employee,
            'attendances' | 'leaves' | 'salaries' | 'loans'
          >]: string | number | undefined
        })
    ),
    {
      columns: (visibleKeys as string[]).concat([
        'altPhoneNumber',
        'fullAddress',
        'gender',
        'contacts',
        'basicSalary',
        'houseRent',
        'foodCost',
        'medicalCost',
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
        'financials',
        'noticePeriod',
        'officeStartTime',
        'officeEndTime',
        'overtime',
        'salaryType',
        'assets'
      ] satisfies (keyof OmitKey<
        Employee,
        (typeof visibleKeys)[number] | 'attendances' | 'leaves' | 'salaries'
      >)[])
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
    data: employees = BLANK_ARRAY,
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
            body: JSON.stringify(
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
        rows={employees
          .filter(
            ({ id, status }) =>
              (approval ? status === 'inactive' : status === 'active') &&
              (self?.type === 'Employee' && self.employeeId
                ? id === self.employeeId
                : true)
          )
          .map(({ company, department, ...employee }) => ({
            ...employee,
            id: getEmployeeId(employee),
            company: company.name,
            department: department.name,
            mainId: employee.id
          }))
          .filter(employee =>
            visibleKeys.find(key =>
              employee[key]
                .toString()
                .toLowerCase()
                .includes(search.toLowerCase())
            )
          )
          .map(employee =>
            visibleKeys
              .map(key =>
                key === 'name' ? (
                  <div className='align-items-center d-flex gap-2 py-2 text-decoration-none'>
                    <img
                      src='/favicon.png'
                      width='50'
                      height='50'
                      className='object-fit-cover rounded-circle'
                    />
                    <div>
                      <p
                        style={{ fontSize: 12 }}
                        className='fw-lighter m-0 text-info'
                      >
                        {employee.email}
                      </p>
                      <p className='fw-bold m-0 text-nowrap'>{employee.name}</p>
                      <p
                        style={{ fontSize: 12 }}
                        className='fw-lighter m-0 text-muted'
                      >
                        {employee.designation.name}
                      </p>
                    </div>
                  </div>
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
                            id: employee.mainId,
                            employee: { status: 'active' }
                          })
                        : employeeUpdate({
                            id: employee.mainId,
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
                      ((employee[key]?.toString().length || 0) > 50
                        ? '...'
                        : '')}
                  </>
                )
              )
              .concat(
                <Link
                  role='button'
                  className='link-primary text-body'
                  to={ROUTES.employee.details.replace(
                    ROUTES.employee._params.id,
                    employee.mainId.toString()
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
