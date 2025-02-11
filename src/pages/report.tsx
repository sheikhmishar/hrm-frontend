import { useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
import { useContext, useEffect, useMemo, useState } from 'react'

import Button from '../components/Button'
import CalenderSlider from '../components/CalenderSlider'
import EmployeeName from '../components/EmployeeName'
import ProtectedComponent from '../components/ProtectedComponent'
import Select from '../components/Select'
import Table from '../components/Table'
import { BLANK_ARRAY } from '../constants/CONSTANTS'
import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import { AuthContext } from '../contexts/auth'
import { ToastContext } from '../contexts/toast'
import {
  dateToString,
  dayDifference,
  downloadStringAsFile,
  getDateRange,
  getEmployeeId,
  stringToDate
} from '../libs'
import modifiedFetch from '../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type Employee from 'backend/Entities/Employee'
import type { allEmployeeAttendances } from 'backend/controllers/attendances'
import type { allCompanies } from 'backend/controllers/companies'
import { allSalaryDetails } from 'backend/controllers/salaries'

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
  }, [dayCount])

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

  const {
    data: _salaryHistory = BLANK_ARRAY,
    isFetching: isSalaryHistoryFetching
  } = useQuery({
    queryKey: ['allSalaryDetails', ServerSITEMAP.salaries.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allSalaryDetails>>(
        ServerSITEMAP.salaries.get
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
    fetchingCompanies || fetchingEmployeeAttendances || isSalaryHistoryFetching

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
          <strong className='text-muted'>Promotion History</strong>
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
    </>
  )
}
export default Report
