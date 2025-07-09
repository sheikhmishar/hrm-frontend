import { useMutation, useQuery } from '@tanstack/react-query'
import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ChangeEventHandler
} from 'react'
import { FaArrowLeft } from 'react-icons/fa6'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Button from '../../components/Button'
import CalenderSlider from '../../components/CalenderSlider'
import EmployeeName from '../../components/EmployeeName'
import Input from '../../components/Input'
import ProtectedComponent from '../../components/ProtectedComponent'
import Select from '../../components/Select'
import Table from '../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../constants/CONSTANTS'
import {
  defaultEmployee,
  defaultMonthlySalary
} from '../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import generateCalender, {
  capitalizeDelim,
  dateToString,
  getDateRange,
  getPreviousMonth,
  mToHM,
  splitGrossSalary,
  stringToDate,
  timeToLocaleString
} from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type Employee from 'backend/Entities/Employee'
import type MonthlySalary from 'backend/Entities/MonthlySalary'
import type { employeeAttendanceDetails } from 'backend/controllers/attendances'
import type { employeeDetails } from 'backend/controllers/employees'
import type { employeeLeaveDetails } from 'backend/controllers/leaves'
import type { loanByEmployee } from 'backend/controllers/loans'
import type {
  allSalariesByEmployee,
  updateMonthlySalary
} from 'backend/controllers/monthly-salaries'
import type { employeeSalaryDetails } from 'backend/controllers/salaries'
import type { holidaysByMonth } from 'backend/controllers/holidays'

const MonthlyPaysheetById = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)
  const navigate = useNavigate()

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
  const [monthlySalary, setMonthlySalary] = useState<MonthlySalary>({
    ...defaultMonthlySalary,
    employee: { ...defaultEmployee }
  })

  const [id, setId] = useState(-1)
  const { id: idFromParam = '-1' } =
    useParams<(typeof ROUTES)['payroll']['_params']>()

  useEffect(() => {
    setId(parseInt(idFromParam) || -1)
  }, [idFromParam])

  const [fromDate, toDate] = useMemo(
    () => getDateRange(getPreviousMonth(getDateRange(new Date())[0])),
    []
  )
  const [fromDateString, toDateString] = useMemo(
    () => [fromDate, toDate].map(dateToString) as [string, string],
    [fromDate, toDate]
  )

  const calender = useMemo(
    () => generateCalender(fromDate, toDate),
    [fromDate, toDate]
  )

  const onMonthlySalaryChange: ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = ({ target: { id, value } }) =>
    setMonthlySalary(monthlySalary => {
      const isNumeric = (
        [
          'basicSalary',
          'houseRent',
          'foodCost',
          'conveyance',
          'medicalCost',
          'overtime',
          'unitOvertimePayment',
          'overtimePayment',
          'bonus',
          'leaveEncashment',
          'late',
          'unitLateDeduction',
          'lateDeduction',
          'penalty',
          'leave',
          'unitAbsenceDeduction',
          'leaveDeduction',
          'absenceDeduction',
          'loanDeduction',
          'totalSalary'
        ] satisfies KeysOfObjectOfType<MonthlySalary, number>[] as string[]
      ).includes(id)

      const updatedSalary = {
        ...monthlySalary,
        [id]: isNumeric ? parseFloat(value) || 0 : value
      }
      // TODO: if total < 0,  obj[k] += total and total 0
      if (isNumeric) {
        if ((id as keyof MonthlySalary) !== 'totalSalary') {
          if (
            (
              ['overtime', 'unitOvertimePayment'] as (keyof MonthlySalary)[]
            ).includes(id as keyof MonthlySalary)
          )
            updatedSalary.overtimePayment = parseFloat(
              (
                updatedSalary.unitOvertimePayment * updatedSalary.overtime
              ).toFixed(2)
            )
          else if (
            (['late', 'unitLateDeduction'] as (keyof MonthlySalary)[]).includes(
              id as keyof MonthlySalary
            )
          )
            updatedSalary.lateDeduction = parseFloat(
              (updatedSalary.unitLateDeduction * updatedSalary.late).toFixed(2)
            )
          else if (
            (
              [
                'leave',
                'absence',
                'unitAbsenceDeduction'
              ] as (keyof MonthlySalary)[]
            ).includes(id as keyof MonthlySalary)
          ) {
            updatedSalary.leaveDeduction = parseFloat(
              (
                updatedSalary.unitAbsenceDeduction * updatedSalary.leave
              ).toFixed(2)
            )
            updatedSalary.absenceDeduction = parseFloat(
              (
                updatedSalary.unitAbsenceDeduction * updatedSalary.absence
              ).toFixed(2)
            )
          }
          updatedSalary.totalSalary = parseFloat(
            (
              updatedSalary.basicSalary +
              updatedSalary.conveyance +
              updatedSalary.foodCost +
              updatedSalary.houseRent +
              updatedSalary.medicalCost +
              updatedSalary.overtimePayment +
              updatedSalary.bonus +
              updatedSalary.leaveEncashment -
              updatedSalary.lateDeduction -
              updatedSalary.leaveDeduction -
              updatedSalary.absenceDeduction -
              updatedSalary.loanDeduction -
              updatedSalary.penalty
            ).toFixed(2)
          )
        }

        if ((id as keyof MonthlySalary) === 'loanDeduction') {
          const loanDeductiondiff =
            updatedSalary.loanDeduction - monthlySalary.loanDeduction

          // TODO: max (0< due < total) global check
          setEmployee(employee => ({
            ...employee,
            loanRemaining: employee.loanRemaining - loanDeductiondiff
          }))
        }
      }

      return updatedSalary
    })

  const { refetch: refetchEmployee, isFetching: employeeLoading } = useQuery({
    queryKey: ['employee', ServerSITEMAP.employees.getById, id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof employeeDetails>>(
        ServerSITEMAP.employees.getById.replace(
          ServerSITEMAP.employees._params.id,
          id.toString()
        )
      ),
    enabled: id > 0,
    onError: onErrorDisplayToast,
    onSuccess: data => data && setEmployee(data)
  })

  const { data: holidays = BLANK_ARRAY, isFetching: holidaysLoading } =
    useQuery({
      queryKey: [
        'holidays',
        ServerSITEMAP.holidays.getByMonthStart,
        fromDateString
      ],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof holidaysByMonth>>(
          ServerSITEMAP.holidays.getByMonthStart.replace(
            ServerSITEMAP.holidays._params.monthStart,
            fromDateString
          )
        ),
      onError: onErrorDisplayToast
    })

  const {
    data: employeeAttendance,
    isFetching: fetchingEmployeeAttendance,
    refetch: refetchEmployeeAttendance
  } = useQuery({
    queryKey: [
      'employeeAttendanceDetails',
      ServerSITEMAP.attendances.getByEmployeeId,
      fromDateString,
      toDateString
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof employeeAttendanceDetails>>(
        ServerSITEMAP.attendances.getByEmployeeId.replace(
          ServerSITEMAP.attendances._params.employeeId,
          id.toString()
        ) +
          '?' +
          new URLSearchParams({
            from: fromDateString,
            to: toDateString
          } satisfies Partial<typeof ServerSITEMAP.attendances._queries>)
      ),
    enabled: id > 0
  })

  const {
    refetch: refetchEmployeeMonthlySalaries,
    data: employeeMonthlySalaries = BLANK_ARRAY,
    isFetching: employeeMonthlySalaryLoading
  } = useQuery({
    queryKey: [
      'employeeMonthlySalaries',
      ServerSITEMAP.monthlySalaries.getAllByEmployeeId,
      id
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allSalariesByEmployee>>(
        ServerSITEMAP.monthlySalaries.getAllByEmployeeId.replace(
          ServerSITEMAP.monthlySalaries._params.id,
          id.toString()
        )
      ),
    enabled: id > 0,
    onError: onErrorDisplayToast,
    onSuccess: data => {
      const monthlySalary = data?.find(
        ({ monthStartDate }) => monthStartDate === fromDateString
      )
      if (monthlySalary) setMonthlySalary(monthlySalary)
      else {
        addToast(
          `Monthly salary not generated for ${fromDateString} -> ${toDateString} `,
          'ERROR'
        )
        navigate(ROUTES.payroll.monthly)
      }
    }
  })

  const {
    refetch: refetchSalaryHistory,
    data: salaryHistory = BLANK_ARRAY,
    isFetching: salaryHistoryFetching
  } = useQuery({
    queryKey: ['salaryHistory', ServerSITEMAP.salaries.getByEmployeeId, id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof employeeSalaryDetails>>(
        ServerSITEMAP.salaries.getByEmployeeId.replace(
          ServerSITEMAP.salaries._params.employeeId,
          id.toString()
        )
      ),
    retry: false,
    enabled: id > 0
  })

  const {
    data: leaveDetailsOfEmployee,
    isFetching: fetchingEmployeeLeaves,
    refetch: refetchEmployeeLeaves
  } = useQuery({
    queryKey: [
      'employeeLeaveDetails',
      ServerSITEMAP.leaves.getByEmployeeId,
      fromDateString,
      toDateString
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof employeeLeaveDetails>>(
        ServerSITEMAP.leaves.getByEmployeeId.replace(
          ServerSITEMAP.leaves._params.employeeId,
          id.toString()
        ) +
          '?' +
          new URLSearchParams({
            from: fromDateString,
            to: toDateString
          } satisfies Partial<typeof ServerSITEMAP.leaves._queries>)
      ),
    enabled: id > 0
  })

  const {
    data: loanEmployee,
    isFetching: fetchingEmployeeLoan,
    refetch: refetchEmployeeLoan
  } = useQuery({
    enabled: id > 0,
    queryKey: ['loans', ServerSITEMAP.loans.getByEmployeeId, id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof loanByEmployee>>(
        ServerSITEMAP.loans.getByEmployeeId.replace(
          ServerSITEMAP.loans._params.employeeId,
          id.toString()
        )
      ),
    onError: onErrorDisplayToast
  })

  const { mutate: monthlySalaryUpdate, isLoading: monthlySalaryUpdateLoading } =
    useMutation({
      mutationKey: [
        'monthlySalaryUpdate',
        ServerSITEMAP.monthlySalaries.put,
        monthlySalary
      ],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof updateMonthlySalary>>(
          ServerSITEMAP.monthlySalaries.put.replace(
            ServerSITEMAP.monthlySalaries._params.id,
            monthlySalary.id.toString()
          ),
          { method: 'put', body: JSON.stringify(monthlySalary) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        refetchEmployee()
        refetchEmployeeLeaves()
        refetchEmployeeAttendance()
        refetchEmployeeLoan()
        refetchEmployeeMonthlySalaries()
        refetchSalaryHistory()
      }
    })

  const isFetching =
    monthlySalaryUpdateLoading ||
    employeeLoading ||
    employeeMonthlySalaryLoading ||
    salaryHistoryFetching ||
    fetchingEmployeeLeaves ||
    fetchingEmployeeLoan ||
    fetchingEmployeeAttendance ||
    holidaysLoading

  const currentDate = new Date()

  const presentWithNoHolidayOrFullPaidLeave = useMemo(
    () =>
      (employeeAttendance?.attendances || []).reduce((total, attendance) => {
        const date = stringToDate(attendance.date)

        const paidLeave = leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
          ({ from, to, type }) =>
            type === 'paid' &&
            date >= stringToDate(from) &&
            date <= stringToDate(to)
        )
        return (
          total +
          (holidays.find(({ date }) => date === attendance.date)
            ? 0
            : paidLeave
            ? paidLeave.duration === 'fullday'
              ? 0
              : 0.5
            : 1)
        )
      }, 0),
    [
      employeeAttendance?.attendances,
      holidays,
      leaveDetailsOfEmployee?.employeeLeave?.leaves
    ]
  )

  const holidayAttendances = useMemo(
    () =>
      (employeeAttendance?.attendances || []).filter(attendance =>
        holidays.find(({ date }) => date === attendance.date)
      ).length,
    [employeeAttendance?.attendances, holidays]
  )

  return (
    <>
      <div className='align-items-center d-flex flex-wrap gap-2 justify-content-between mb-3'>
        <Link
          to={ROUTES.payroll.monthly}
          className='link-primary text-decoration-none'
        >
          <FaArrowLeft /> Monthly Payroll
        </Link>
        {isFetching && (
          <div
            className='me-auto ms-3 spinner-border text-primary'
            role='status'
          >
            <span className='visually-hidden'>Loading...</span>
          </div>
        )}
        <CalenderSlider
          monthly
          currentDate={fromDate}
          setCurrentDate={() => {}}
        />
      </div>

      <div className='row'>
        <div className='col-12 col-4-lg my-2'>
          <div className='border-0 card h-100 shadow-sm'>
            <div className='card-body'>
              <div className='row'>
                <Link
                  className='text-decoration-none'
                  role='button'
                  to={ROUTES.employee.details.replace(
                    ROUTES.employee._params.id,
                    employee.id.toString()
                  )}
                >
                  <EmployeeName employee={employee} />
                </Link>
              </div>
              <div className='my-2'>
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
                  <div className='align-items-center my-1 row' key={k}>
                    <div className='col-6'>
                      <strong className='text-muted'>
                        {capitalizeDelim(k)}
                      </strong>
                    </div>
                    <div key={k} className='col-6'>
                      <h6>{employee[k]}</h6>
                    </div>
                  </div>
                ))}
                {(
                  ['taskWisePayment', 'wordLimit'] satisfies KeysOfObjectOfType<
                    Employee,
                    number | undefined
                  >[]
                ).map(k => (
                  <div className='align-items-center my-1 row' key={k}>
                    <div className='col-6'>
                      <strong className='text-muted'>
                        {capitalizeDelim(k)}
                      </strong>
                    </div>
                    <div key={k} className='col-6'>
                      <h6>{employee[k] || ''}</h6>
                    </div>
                  </div>
                ))}
              </div>
              <div className='d-flex justify-content-center mt-3'>
                <div className='m-2 text-center'>
                  <Link
                    to={ROUTES.employee.details.replace(
                      ROUTES.employee._params.id,
                      idFromParam
                    )}
                    className='text-decoration-none text-primary'
                  >
                    See Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <h5>Attendance Details</h5>

        <div className='col-12 col-8-lg mb-2'>
          <div className='border-0 card h-100 shadow-sm'>
            <div className='card-body text-muted'>
              <div className='my-2 row'>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>Present</strong>
                  </h6>
                  <input
                    className='d-inline form-control me-2 w-50'
                    type='number'
                    disabled
                    value={presentWithNoHolidayOrFullPaidLeave}
                  />
                  Days
                </div>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>Holiday Attendances</strong>
                  </h6>
                  <input
                    className='d-inline form-control me-2 w-50'
                    type='number'
                    disabled
                    value={holidayAttendances}
                  />
                  Days
                </div>
              </div>
              <div className='my-2 row'>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>LWP</strong>
                  </h6>
                  {(
                    ['leave'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                  Days
                </div>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>Absent</strong>
                  </h6>
                  {(
                    ['absence'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                  Days
                </div>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>Unit Absence/LWP Deduction</strong>
                  </h6>
                  {(
                    ['unitAbsenceDeduction'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                  <br />
                  {/* TODO: info icon hover */}
                  [Employee Basic Salary / TotalDays]
                </div>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>LWP Deduction</strong>
                  </h6>
                  {(
                    ['leaveDeduction'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                </div>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>Absence Deduction</strong>
                  </h6>
                  {(
                    ['absenceDeduction'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                </div>
              </div>
              <div className='my-2 row'>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>Overtime</strong>
                  </h6>
                  {(
                    ['overtime'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                  Minutes
                </div>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>Unit Overtime Payment</strong>
                  </h6>
                  {(
                    ['unitOvertimePayment'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                  <br />
                  [Employee Basic Salary / 208 * 3 / 60]
                </div>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>Overtime Payment</strong>
                  </h6>

                  {(
                    ['overtimePayment'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                </div>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>Late time</strong>
                  </h6>
                  {(
                    ['late'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                  Minutes
                </div>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>Unit Late Deduction Payment</strong>
                  </h6>
                  {(
                    ['unitLateDeduction'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                  <br />
                  [10]
                </div>
                <div className='col-6 col-lg-2 my-1'>
                  <h6>
                    <strong>Late Deduction Payment</strong>
                  </h6>

                  {(
                    ['lateDeduction'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='my-2'>
        <h5>Attendance Table</h5>
        <div className='d-flex flex-column ms-auto pb-2'>
          <span className='text-nowrap'>
            <strong className='text-primary'>P</strong> = Present,
          </span>
          <span className='text-nowrap'>
            <strong className='text-danger'>A</strong> = Absent / Leave Without
            Payment,
          </span>
          <span className='text-nowrap'>
            <strong className='text-danger'>-</strong> = Future,
          </span>
          <span className='text-nowrap'>
            <strong className='text-black-50'>O</strong> = Offday,
          </span>
          <span className='text-nowrap'>
            <strong className='text-black-50'>L</strong>,&nbsp;
            <strong className='text-success'>L/1</strong>,&nbsp;
            <strong className='text-success'>L/2</strong>, &nbsp;
            <strong className='text-danger'>L/1</strong> or&nbsp;
            <strong className='text-danger'>L/2</strong> = Paid Leave,
          </span>
          <span className='text-nowrap'>
            <strong className='text-success'>OA</strong> = Offday Attendance
          </span>
        </div>
        <Table
          columns={[
            'Date',
            'Attendance',
            'Sessions',
            'Office Start',
            'Late',
            'Early In',
            'Office End',
            'Overtime',
            'Early Out',
            'Tasks',
            'Total Time',
            'Status'
          ]}
          rows={calender.map(({ month, date }) => {
            const year =
              month === '01' ? toDate.getFullYear() : fromDate.getFullYear()
            const dateString = `${month}-${date}`
            const fullDateString = `${year}-${dateString}`
            const fullDate = stringToDate(fullDateString)

            const attendance = employeeAttendance?.attendances?.find(
              attendance => attendance.date.substring(5) === dateString
            )
            const attendanceRow = attendance
              ? [
                  <>
                    {attendance.sessions.map(session => (
                      <div key={session.id} className='text-nowrap'>
                        {timeToLocaleString(session.arrivalTime) +
                          (session.leaveTime
                            ? ' -> ' + timeToLocaleString(session.leaveTime)
                            : '')}
                      </div>
                    ))}
                  </>,
                  <>{timeToLocaleString(employee.officeStartTime)}</>,
                  <>
                    {attendance.late === -1
                      ? 'N/A'
                      : mToHM(Math.max(0, attendance.late))}
                  </>,
                  <>
                    {attendance.late === -1
                      ? 'N/A'
                      : mToHM(Math.abs(Math.min(0, attendance.late)))}
                  </>,
                  <>{timeToLocaleString(employee.officeEndTime)}</>,
                  <>
                    {attendance.overtime === -1
                      ? 'N/A'
                      : mToHM(Math.max(0, attendance.overtime))}
                  </>,
                  <>
                    {attendance.overtime === -1
                      ? 'N/A'
                      : mToHM(Math.abs(Math.min(0, attendance.overtime)))}
                  </>,
                  <>
                    {(employee.taskWisePayment && attendance.tasks) || 'N/A'}
                  </>,
                  <>{mToHM(attendance.totalTime)}</>,
                  <>
                    <span
                      className={
                        attendance.late === -1
                          ? ''
                          : attendance.late === 0
                          ? 'text-bg-warning'
                          : attendance.late < 0
                          ? 'text-bg-success'
                          : 'text-bg-danger'
                      }
                    >
                      {attendance.late === -1
                        ? 'N/A'
                        : attendance.late === 0
                        ? 'In time'
                        : attendance.late < 0
                        ? 'Early In'
                        : 'Late In'}
                    </span>
                    |
                    <span
                      className={
                        attendance.overtime === -1
                          ? ''
                          : attendance.overtime === 0
                          ? 'text-bg-warning'
                          : attendance.overtime < 0
                          ? 'text-bg-danger'
                          : 'text-bg-success'
                      }
                    >
                      {attendance.overtime === -1
                        ? 'N/A'
                        : attendance.overtime === 0
                        ? 'On time'
                        : attendance.overtime < 0
                        ? 'Early Out'
                        : 'Overtime'}
                    </span>
                  </>
                ]
              : []

            return [
              <span className='text-nowrap'>{fullDateString}</span>
            ].concat(
              // FIXME; undefined ?
              attendance
                ? [
                    holidays.find(
                      ({ date: d }) => dateString === d.substring(5)
                    ) ? (
                      <strong className='text-success'>OA</strong>
                    ) : leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
                        ({ from, to, duration, type }) =>
                          type === 'paid' &&
                          stringToDate(from) <= fullDate &&
                          stringToDate(to) >= fullDate &&
                          duration === 'first_halfday'
                      ) ? (
                      <strong className='text-success'>L/1</strong>
                    ) : leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
                        ({ from, to, duration, type }) =>
                          type === 'paid' &&
                          stringToDate(from) <= fullDate &&
                          stringToDate(to) >= fullDate &&
                          duration === 'second_halfday'
                      ) ? (
                      <strong className='text-success'>L/2</strong>
                    ) : (
                      <strong className='text-primary'>P</strong>
                    )
                  ].concat(attendanceRow)
                : [
                    holidays.find(
                      ({ date: d }) => dateString === d.substring(5)
                    ) ? (
                      <strong className='text-black-50'>O</strong>
                    ) : leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
                        // TODO: precompute
                        ({ from, to, duration, type }) =>
                          type === 'paid' &&
                          stringToDate(from) <= fullDate &&
                          stringToDate(to) >= fullDate &&
                          duration === 'fullday'
                      ) ? (
                      <strong className='text-black-50'>L</strong>
                    ) : leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
                        ({ from, to, duration, type }) =>
                          type === 'paid' &&
                          stringToDate(from) <= fullDate &&
                          stringToDate(to) >= fullDate &&
                          duration === 'first_halfday'
                      ) ? (
                      <strong className='text-danger'>L/1</strong>
                    ) : leaveDetailsOfEmployee?.employeeLeave?.leaves.find(
                        ({ from, to, duration, type }) =>
                          type === 'paid' &&
                          stringToDate(from) <= fullDate &&
                          stringToDate(to) >= fullDate &&
                          duration !== 'second_halfday'
                      ) ? (
                      <strong className='text-danger'>L/2</strong>
                    ) : (
                      <strong className='text-danger'>
                        {fullDate > currentDate ? '-' : 'A'}
                      </strong>
                    )
                  ].concat([
                    <></>,
                    <></>,
                    <></>,
                    <></>,
                    <></>,
                    <></>,
                    <></>,
                    <></>,
                    <></>,
                    <></>,
                    <></>
                  ])
            )
          })}
        />
      </div>

      <h5>Leave Details</h5>
      <div className='row'>
        <div className='col-12 col-lg-8 mb-4'>
          <div className='border-0 card h-100 shadow-sm'>
            <div className='card-body text-muted'>
              <div className='my-2 row'>
                <div className='col-12'>
                  <h5 className='text-center'>Paid Leaves</h5>
                  <hr />
                </div>
                <div className='col-4'>
                  <h6>
                    <strong>Total Monthly Allowed</strong>
                  </h6>
                  <h5>3 Days</h5>
                </div>
                <div className='col-4 text-warning'>
                  <h6>
                    <strong>Total Monthly Taken</strong>
                  </h6>
                  <h5>
                    {leaveDetailsOfEmployee?.employeeLeave?.leaves
                      .filter(leave => leave.type === 'paid')
                      .reduce((total, leave) => total + leave.totalDays, 0) ||
                      0}{' '}
                    Days
                  </h5>
                </div>
                <div className='col-4 text-warning'>
                  <h6>
                    <strong>Total Monthly Remaining</strong>
                  </h6>
                  <h5>
                    {3 -
                      (leaveDetailsOfEmployee?.employeeLeave?.leaves
                        .filter(leave => leave.type === 'paid')
                        .reduce((total, leave) => total + leave.totalDays, 0) ||
                        0)}{' '}
                    Days
                  </h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='col-12 col-lg-4 mb-4'>
          <div className='border-0 card h-100 shadow-sm'>
            <div className='card-body text-muted'>
              <div className='my-2 row'>
                <div className='col-12'>
                  <h5 className='text-center'>LWPs</h5>
                  <hr />
                </div>
                <div className='col-4'>
                  <h6>
                    <strong>Leave Taken</strong>
                  </h6>
                  {(
                    ['leave'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                  Days
                </div>
                <div className='col-4'>
                  <h6>
                    <strong>Unit Leave Deduction</strong>
                  </h6>
                  {(
                    ['unitAbsenceDeduction'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                </div>
                <div className='col-4 text-warning'>
                  <h6>
                    <strong>Leave Deduction</strong>
                  </h6>
                  {(
                    ['leaveDeduction'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='col-12 mb-4'>
          <div className='border-0 card h-100 shadow-sm'>
            <div className='card-body text-muted'>
              <div className='my-2 row text-center'>
                <div className='col-4'>
                  <h6>
                    <strong>Total Yearly Allowed</strong>
                  </h6>
                  <h5>13 Days</h5>
                </div>
                <div className='col-4 text-warning'>
                  <h6>
                    <strong>Total Yearly Taken</strong>
                  </h6>
                  <h5>
                    {leaveDetailsOfEmployee?.employeePaidLeaveInYear || 0} Days
                  </h5>
                </div>
                <div className='col-4 text-warning'>
                  <h6>
                    <strong>Total Yearly Remaining</strong>
                  </h6>
                  <h5>
                    {13 -
                      (leaveDetailsOfEmployee?.employeePaidLeaveInYear ||
                        0)}{' '}
                    Days
                  </h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h5>Leave History</h5>

      <Table
        columns={[
          'From',
          'To',
          'Duration',
          'Total days',
          'Leave Type',
          'Leave status'
        ]}
        rows={(leaveDetailsOfEmployee?.employeeLeave?.leaves || []).map(
          leave => [
            <>{leave.from}</>,
            <>{leave.to}</>,
            <>{leave.duration}</>,
            <>{leave.totalDays}</>,
            <>{leave.type}</>,
            <>{leave.status}</>
          ]
        )}
      />

      <div className='my-2'>
        <h5>Loan Details</h5>
        <div className='col-12 col-8-lg mb-2'>
          <div className='border-0 card h-100 shadow-sm'>
            <div className='card-body text-muted'>
              <div className='my-2 row'>
                <div className='col-3'>
                  <h6>
                    <strong>Total Loan Taken</strong>
                  </h6>
                  <input
                    className='d-inline form-control me-2 w-50'
                    type='number'
                    disabled
                    value={employee.loanTaken}
                    onChange={onEmployeeChange}
                  />
                </div>
                <div className='col-3'>
                  <h6>
                    <strong>Amount Paid</strong>
                  </h6>
                  <input
                    className='d-inline form-control me-2 w-50'
                    type='number'
                    disabled
                    value={employee.loanTaken - employee.loanRemaining}
                  />
                </div>
                <div className='col-3'>
                  <h6>
                    <strong>Amount Due</strong>
                  </h6>
                  <input
                    className='d-inline form-control me-2 w-50'
                    type='number'
                    disabled
                    value={employee.loanRemaining}
                  />
                </div>
                <div className='col-3'>
                  <h6>
                    <strong>Amount Deduction</strong>
                  </h6>
                  {(
                    ['loanDeduction'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='my-2'>
        <h5>Loan History</h5>
        <Table
          columns={['Date', 'Amount']}
          rows={(loanEmployee?.loans || []).map(loan => [
            <>{loan.date}</>,
            <>{loan.amount}</>
          ])}
        />
      </div>
      {/* TODO: loan payment */}

      <div className='my-2'>
        <h5>Salary Payment History</h5>
        <Table
          columns={[
            'Month',
            'Basic Salary',
            'House Rent',
            'Food Cost',
            'Conveyance',
            'Medical Cost',
            'Overtime',
            'Overtime Payment',
            'Bonus',
            'Leave Encashment',
            'Late',
            'Late Deduction',
            'Penalty',
            'Leave',
            'Leave Deduction',
            'Loan Deduction',
            'Total Salary',
            'Payment Method',
            'Status'
          ]}
          rows={employeeMonthlySalaries
            .filter(({ employee: { id: employeeId } }) => employeeId === id)
            .map(salary => [
              <>{salary.monthStartDate.substring(0, 7)}</>,
              <>{salary.basicSalary}</>,
              <>{salary.houseRent}</>,
              <>{salary.foodCost}</>,
              <>{salary.conveyance}</>,
              <>{salary.medicalCost}</>,
              <>{salary.overtime}</>,
              <>{salary.overtimePayment}</>,
              <>{salary.bonus}</>,
              <>{salary.leaveEncashment}</>,
              <>{salary.late}</>,
              <>{salary.lateDeduction}</>,
              <>{salary.penalty}</>,
              <>{salary.leave}</>,
              <>{salary.leaveDeduction}</>,
              <>{salary.loanDeduction}</>,
              <>{salary.totalSalary}</>,
              <>{salary.paymentMethod}</>,
              <>{salary.status}</>
            ])}
        />
      </div>

      <div className='my-2'>
        <h5>Salary Update History</h5>
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
      </div>

      <div className='my-2'>
        <h5>Miscellaneous</h5>
        <div className='col-12 col-8-lg mb-2'>
          <div className='border-0 card h-100 shadow-sm'>
            <div className='card-body text-muted'>
              <div className='my-2 row'>
                <div className='col-4'>
                  <h6>
                    <strong>Bonus</strong>
                  </h6>
                  {(
                    ['bonus'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                </div>
                <div className='col-4'>
                  <h6>
                    <strong>Leave Encashment</strong>
                  </h6>
                  {(
                    ['leaveEncashment'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                </div>
                <div className='col-4'>
                  <h6>
                    <strong>Other Deduction</strong>
                  </h6>
                  {(
                    ['penalty'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='my-2'>
        <h5>Total</h5>
        <div className='col-12 col-8-lg mb-2'>
          <div className='border-0 card h-100 shadow-sm'>
            <div className='card-body text-muted'>
              <div className='justify-content-center my-2 row'>
                <div className='col-6'>
                  {(
                    ['totalSalary'] satisfies KeysOfObjectOfType<
                      MonthlySalary,
                      number
                    >[]
                  ).map(k => (
                    <input
                      key={k}
                      id={k}
                      name={k}
                      className='d-inline form-control me-2 w-50'
                      type='number'
                      disabled={isFetching}
                      value={monthlySalary[k]}
                      onChange={onMonthlySalaryChange}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(['status'] satisfies KeysOfObjectOfType<MonthlySalary, string>[]).map(
        k => (
          <Select
            key={k}
            id={k}
            disabled={isFetching}
            autoComplete='true'
            label={capitalizeDelim(k)}
            containerClass='my-3'
            placeholder={'Enter ' + capitalizeDelim(k)}
            value={monthlySalary[k]}
            options={(
              ['Paid', 'Unpaid'] satisfies MonthlySalary[typeof k][]
            ).map(name => ({ value: name, label: name }))}
            onChange={onMonthlySalaryChange}
          />
        )
      )}

      {(
        ['paymentMethod'] satisfies KeysOfObjectOfType<MonthlySalary, string>[]
      ).map(k => (
        <Input
          key={k}
          disabled={isFetching}
          id={k}
          label={capitalizeDelim(k)}
          containerClass='my-3'
          placeholder={'Enter ' + capitalizeDelim(k)}
          value={monthlySalary[k]}
          onChange={onMonthlySalaryChange}
        />
      ))}
      <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
        <div className='d-flex justify-content-end mt-3'>
          <Button
            disabled={isFetching}
            className='btn-primary mx-2'
            onClick={() => monthlySalaryUpdate()}
          >
            <span className='align-items-center d-flex'>
              Update
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
      </ProtectedComponent>
    </>
  )
}

export default MonthlyPaysheetById
