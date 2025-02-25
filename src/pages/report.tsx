import { useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Button from '../components/Button'
import CalenderSlider from '../components/CalenderSlider'
import EmployeeName from '../components/EmployeeName'
import ProtectedComponent from '../components/ProtectedComponent'
import Select from '../components/Select'
import Table from '../components/Table'
import { BLANK_ARRAY, ROUTES } from '../constants/CONSTANTS'
import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import { AuthContext } from '../contexts/auth'
import { ToastContext } from '../contexts/toast'
import {
  dateToString,
  dayDifference,
  downloadStringAsFile,
  getDateRange,
  getEmployeeId,
  getYearRange,
  stringToDate
} from '../libs'
import modifiedFetch from '../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type Employee from 'backend/Entities/Employee'
import type { allEmployeeAttendances } from 'backend/controllers/attendances'
import type { allCompanies } from 'backend/controllers/companies'
import type { allSalaryDetails } from 'backend/controllers/salaries'
import type { allEmployeeLeaves } from 'backend/controllers/leaves'

const getOvertimeCsv = (
  columns: string[],
  employees: Employee[],
  fromDate: Date
) =>
  Papa.unparse(
    [['ID'].concat(columns)].concat(
      employees.map(employee =>
        [getEmployeeId(employee), employee.name, employee.department.name]
          .concat(
            new Array<string>(columns.length - 3)
              .fill('')
              // FIXME: ?.
              .map((_, i) => {
                const overtime =
                  employee.attendances?.find(
                    ({ date }) =>
                      date ===
                      dateToString(
                        new Date(fromDate.getTime() + i * 24 * 3600000)
                      )
                  )?.overtime || -1
                return overtime > 0 ? overtime.toString() : '0'
              })
          )
          .concat(
            employee.attendances
              .reduce(
                (total, { overtime }) => total + (overtime > 0 ? overtime : 0),
                0
              )
              .toString()
          )
      )
    )
  )

const getPromotionCsv = (employees: Employee[]) =>
  Papa.unparse(
    [
      [
        'ID',
        'Name',
        'Designation',
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
      employees.reduce(
        (prev, employee) =>
          prev.concat(
            // FIXME: ?.
            (employee.salaries || []).map(salary =>
              [
                getEmployeeId(employee),
                employee.name,
                employee.designation.name,
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
                new Date(salary.changedAt).toString()
              ].map(v => v?.toString() || '')
            )
          ),
        [] as string[][]
      )
    )
  )

const getCsvFromLeaves = (employees: Employee[]) =>
  Papa.unparse(
    employees.reduce(
      (prev, employee) =>
        prev.concat(
          employee.leaves.map(({ from, to, duration, type, status }) => ({
            id: getEmployeeId(employee),
            employee: employee.name,
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
        'id',
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

const Report: React.FC = () => {
  const { self } = useContext(AuthContext)
  const { onErrorDisplayToast } = useContext(ToastContext)

  const [companyId, setCompanyId] = useState(-1)

  const [currentDate, setCurrentDate] = useState(new Date())

  const [fromDate, toDate] = useMemo(
    () => getDateRange(currentDate),
    [currentDate]
  )
  const [fromDateString, toDateString] = useMemo(
    () => [fromDate, toDate].map(dateToString) as [string, string],
    [fromDate, toDate]
  )

  const [yearStart, yearEnd] = useMemo(() => getYearRange(fromDate), [fromDate])

  const dayCount = useMemo(
    () => dayDifference(toDate, fromDate),
    [toDate, fromDate]
  )
  const overtimeColumns = useMemo(() => {
    return ['Name', 'Department']
      .concat(
        new Array<string>(dayCount)
          .fill('')
          .map(
            (_, i) =>
              `OT Date-(${new Date(
                fromDate.getTime() + i * 24 * 3600000
              ).getDate()})`
          )
      )
      .concat('Total OT')
  }, [dayCount, fromDate])

  useEffect(
    () => setCurrentDate(stringToDate(fromDateString)),
    [fromDateString]
  )

  const {
    data: _attendances = BLANK_ARRAY,
    isFetching: fetchingEmployeeAttendances
  } = useQuery({
    queryKey: [
      'allEmployeeAttendances',
      ServerSITEMAP.attendances.get,
      fromDateString,
      toDateString
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployeeAttendances>>(
        ServerSITEMAP.attendances.get +
          '?' +
          new URLSearchParams({
            from: fromDateString,
            to: toDateString
          } satisfies Partial<typeof ServerSITEMAP.attendances._queries>)
      ),
    onError: onErrorDisplayToast
  })

  const { data: _leaves = BLANK_ARRAY, isFetching: fetchingEmployeeLeaves } =
    useQuery({
      queryKey: [
        'allEmployeeLeaves',
        ServerSITEMAP.leaves.get,
        fromDateString,
        toDateString
      ],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof allEmployeeLeaves>>(
          ServerSITEMAP.leaves.get +
            '?' +
            new URLSearchParams({
              from: yearStart,
              to: yearEnd
            } satisfies Partial<typeof ServerSITEMAP.leaves._queries>)
        ),
      onError: onErrorDisplayToast
    })

  const {
    data: _salaryHistory = BLANK_ARRAY,
    isFetching: isSalaryHistoryFetching
  } = useQuery({
    queryKey: [
      'allSalaryDetails',
      ServerSITEMAP.salaries.get,
      yearStart,
      yearEnd
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allSalaryDetails>>(
        ServerSITEMAP.salaries.get + '?' +
          new URLSearchParams({ from: yearStart, to: yearEnd } satisfies {
            [k in keyof typeof ServerSITEMAP.salaries._queries]: string
          })
      )
  })

  const { data: companies = BLANK_ARRAY, isFetching: fetchingCompanies } =
    useQuery({
      queryKey: ['companies', ServerSITEMAP.companies.get],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof allCompanies>>(
          ServerSITEMAP.companies.get
        ),
      onError: onErrorDisplayToast
    })

  const isFetching =
    fetchingCompanies ||
    fetchingEmployeeAttendances ||
    isSalaryHistoryFetching ||
    fetchingEmployeeLeaves

  const attendances = useMemo(
    () =>
      _attendances.filter(
        ({ id, company: { id: cid } }) =>
          (companyId < 1 || cid === companyId) &&
          (self?.type === 'Employee' && self.employeeId
            ? id === self.employeeId
            : true)
      ),
    [_attendances, companyId, self]
  )
  const leaves = useMemo(
    () =>
      _leaves.filter(
        ({ id, company: { id: cid } }) =>
          (companyId < 1 || cid === companyId) &&
          (self?.type === 'Employee' && self.employeeId
            ? id === self.employeeId
            : true)
      ),
    [_leaves, companyId, self]
  )
  const salaryHistory = useMemo(
    () =>
      _salaryHistory.filter(
        ({ id, company: { id: cid } }) =>
          (companyId < 1 || cid === companyId) &&
          (self?.type === 'Employee' && self.employeeId
            ? id === self.employeeId
            : true)
      ),
    [_salaryHistory, companyId, self]
  )

  return (
    <>
      <div className='align-items-center d-flex flex-wrap gap-2 justify-content-between mb-3'>
        <CalenderSlider
          monthly
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
        />

        <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
          <Select
            id='company'
            label=''
            value={companyId}
            onChange={({ target: { value } }) =>
              setCompanyId(parseInt(value) || -1)
            }
            className='me-auto w-25'
            options={[{ label: 'All', value: -1 }].concat(
              companies.map(company => ({
                label: company.name,
                value: company.id
              }))
            )}
          />
        </ProtectedComponent>
        {isFetching && (
          <div className='ms-3 spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        )}
      </div>

      <div className='align-items-center d-flex my-2'>
        <h5 className='mb-0'>
          <strong className='text-muted'> Overtime Attendance </strong>
        </h5>

        <Button
          onClick={() =>
            downloadStringAsFile(
              getOvertimeCsv(overtimeColumns, attendances, fromDate),
              'employeeOvertime.csv',
              { type: 'text/csv' }
            )
          }
          className='btn-primary ms-auto'
        >
          Export CSV
        </Button>
      </div>
      <Table
        columns={overtimeColumns}
        rows={attendances.map(employee =>
          [
            <Link
              to={
                ROUTES.attendance.details.replace(
                  ROUTES.attendance._params.id,
                  employee.id.toString()
                ) +
                '?' +
                new URLSearchParams({
                  month: fromDateString
                } satisfies typeof ROUTES.attendance._queries)
              }
              className='text-decoration-none'
            >
              <EmployeeName
                employee={{
                  id: employee.id,
                  dateOfJoining: employee.dateOfJoining,
                  name: employee.name,
                  designation: employee.designation.name,
                  email: employee.email,
                  photo: employee.photo
                }}
              />
            </Link>,
            <>{employee.department.name}</>
          ]
            .concat(
              new Array<JSX.Element>(dayCount)
                .fill(<></>)
                // FIXME: ?.
                .map((_, i) => {
                  const overtime =
                    employee.attendances?.find(
                      ({ date }) =>
                        date ===
                        dateToString(
                          new Date(fromDate.getTime() + i * 24 * 3600000)
                        )
                    )?.overtime || -1
                  return <>{overtime > 0 ? overtime : 0}</>
                })
            )
            .concat(
              <>
                {employee.attendances.reduce(
                  (total, { overtime }) =>
                    total + (overtime > 0 ? overtime : 0),
                  0
                )}
              </>
            )
        )}
      />

      <hr />

      <div className='align-items-center d-flex my-2'>
        <h5 className='mb-0'>
          <strong className='text-muted'>
            Yearly Promotion History ({yearStart.substring(0, 4)})
          </strong>
        </h5>

        <Button
          onClick={() =>
            downloadStringAsFile(
              getPromotionCsv(salaryHistory),
              'employeeSalaryHistory.csv',
              { type: 'text/csv' }
            )
          }
          className='btn-primary ms-auto'
        >
          Export CSV
        </Button>
      </div>
      <Table
        columns={[
          'Name',
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
        rows={salaryHistory.reduce(
          (prev, employee) =>
            prev.concat(
              // FIXME: ?.
              (employee.salaries || []).map(salary => [
                <Link
                  to={ROUTES.payroll.updateById.replace(
                    ROUTES.payroll._params.id,
                    employee.id.toString()
                  )}
                  className='text-decoration-none'
                >
                  <EmployeeName
                    employee={{
                      id: employee.id,
                      dateOfJoining: employee.dateOfJoining,
                      name: employee.name,
                      designation: employee.designation.name,
                      email: employee.email,
                      photo: employee.photo
                    }}
                  />
                </Link>,
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
              ])
            ),
          [] as JSX.Element[][]
        )}
      />

      <div className='align-items-center d-flex my-2'>
        <h5 className='mb-0'>
          <strong className='text-muted'>
            Yearly Leave History ({yearStart.substring(0, 4)})
          </strong>
        </h5>

        <Button
          onClick={() =>
            downloadStringAsFile(
              getCsvFromLeaves(leaves),
              'employeeLeaveHistory.csv',
              { type: 'text/csv' }
            )
          }
          className='btn-primary ms-auto'
        >
          Export CSV
        </Button>
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
          'Leave status'
        ]}
        rows={leaves.reduce(
          (prev, employee) =>
            prev.concat(
              // FIXME: undefined
              employee.leaves?.map(leave => [
                <Link
                  role='button'
                  to={
                    ROUTES.leave.details.replace(
                      ROUTES.leave._params.id,
                      employee.id.toString()
                    ) +
                    '?' +
                    new URLSearchParams({
                      month: fromDateString
                    } satisfies typeof ROUTES.leave._queries)
                  }
                  className='text-decoration-none'
                >
                  <EmployeeName
                    employee={{
                      id: employee.id,
                      dateOfJoining: employee.dateOfJoining,
                      name: employee.name,
                      designation: employee.designation.name,
                      email: employee.email,
                      photo: employee.photo
                    }}
                  />
                </Link>,
                <>{employee.company.name}</>,
                <>{leave.from}</>,
                <>{leave.to}</>,
                <>{leave.duration}</>,
                <>{leave.totalDays}</>,
                <>{leave.type}</>,
                <>{leave.status}</>
              ])
            ),
          [] as JSX.Element[][]
        )}
      />
    </>
  )
}
export default Report
