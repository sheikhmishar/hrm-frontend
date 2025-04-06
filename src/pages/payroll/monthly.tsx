import { useMutation, useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ChangeEventHandler
} from 'react'
import { FaEye, FaPen } from 'react-icons/fa6'
import { Link } from 'react-router-dom'

import Button from '../../components/Button'
import CalenderSlider from '../../components/CalenderSlider'
import EmployeeName from '../../components/EmployeeName'
import Input from '../../components/Input'
import Modal from '../../components/Modal'
import ProtectedComponent from '../../components/ProtectedComponent'
import Select from '../../components/Select'
import Table from '../../components/Table'
import { BLANK_ARRAY, ROUTES, ROUTE_PARAMS } from '../../constants/CONSTANTS'
import {
  defaultEmployee,
  defaultMonthlySalary
} from '../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../contexts/auth'
import { ToastContext } from '../../contexts/toast'
import {
  capitalizeDelim,
  dateToString,
  downloadStringAsFile,
  getDateRange,
  getEmployeeId,
  stringToDate
} from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import MonthlySalary from 'backend/Entities/MonthlySalary'
import { allCompanies } from 'backend/controllers/companies'
import {
  allMonthlySalaries,
  confirmMonthlySalary,
  generateMonthlySalary,
  monthlySalaryDetails,
  updateMonthlySalary,
  withdrawMonthlySalary
} from 'backend/controllers/monthly-salaries'

const getCsvFromSalaries = (employeeMonthlySalaries: MonthlySalary[]) =>
  Papa.unparse(
    employeeMonthlySalaries.map(salary => ({
      id: getEmployeeId(salary.employee),
      name: salary.employee.name,
      company: salary.employee.company.name,
      basicSalary: salary.basicSalary,
      houseRent: salary.houseRent,
      foodCost: salary.foodCost,
      conveyance: salary.conveyance,
      medicalCost: salary.medicalCost,
      grossSalary:
        salary.basicSalary +
        salary.foodCost +
        salary.houseRent +
        salary.conveyance +
        salary.medicalCost,
      overtime: salary.overtime,
      overtimePayment: salary.overtimePayment,
      bonus: salary.bonus,
      leaveEncashment: salary.leaveEncashment,
      late: salary.late,
      lateDeduction: salary.lateDeduction,
      penalty: salary.penalty,
      leave: salary.leave,
      leaveDeduction: salary.leaveDeduction,
      loanDeduction: salary.loanDeduction,
      totalSalary: salary.totalSalary,
      paymentMethod: salary.paymentMethod,
      status: salary.status
    })),
    {
      columns: [
        'id',
        'name',
        'company',
        'basicSalary',
        'houseRent',
        'foodCost',
        'conveyance',
        'medicalCost',
        'grossSalary',
        'overtime',
        'overtimePayment',
        'bonus',
        'leaveEncashment',
        'late',
        'lateDeduction',
        'penalty',
        'leave',
        'leaveDeduction',
        'loanDeduction',
        'totalSalary',
        'paymentMethod',
        'status'
      ]
    }
  )

const numericKeys = [
  'basicSalary',
  'houseRent',
  'foodCost',
  'conveyance',
  'medicalCost',
  'overtime',
  'overtimePayment',
  'bonus',
  'leaveEncashment',
  'late',
  'lateDeduction',
  'penalty',
  'leave',
  'leaveDeduction',
  'loanDeduction',
  'totalSalary'
] satisfies KeysOfObjectOfType<MonthlySalary, number>[]

const MonthlyPaysheet = () => {
  const { self } = useContext(AuthContext)
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [companyId, setCompanyId] = useState(-1)

  const [monthlySalary, setMonthlySalary] = useState<MonthlySalary>({
    ...defaultMonthlySalary,
    employee: { ...defaultEmployee }
  })
  const [currentDate, setCurrentDate] = useState(new Date())

  const [fromDate, toDate] = useMemo(
    () => getDateRange(currentDate),
    [currentDate]
  )
  const [fromDateString, toDateString] = useMemo(
    () => [fromDate, toDate].map(dateToString) as [string, string],
    [fromDate, toDate]
  )

  useEffect(
    () => setCurrentDate(stringToDate(fromDateString)),
    [fromDateString]
  )

  const onMonthlySalaryChange: ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = ({ target: { id, value } }) =>
    setMonthlySalary(monthlySalary => {
      const isNumeric = (numericKeys as string[]).includes(id)

      const updatedSalary = {
        ...monthlySalary,
        [id]: isNumeric ? parseFloat(value) : value
      }
      if (isNumeric && (id as keyof MonthlySalary) !== 'totalSalary')
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
            updatedSalary.loanDeduction -
            updatedSalary.penalty
          ).toFixed(2)
        )

      return updatedSalary
    })

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar)
        setMonthlySalary(monthlySalary => ({ ...monthlySalary, id: -1 }))
      return !sidebar
    })

  const {
    refetch: refetchCompanies,
    data: companies = BLANK_ARRAY,
    isFetching: fetchingCompanies
  } = useQuery({
    queryKey: ['companies', ServerSITEMAP.companies.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allCompanies>>(
        ServerSITEMAP.companies.get
      ),
    onError: onErrorDisplayToast
  })
  const {
    data: _employeeMonthlySalaries = BLANK_ARRAY,
    isFetching: fetchingMonthlySalaries,
    refetch
  } = useQuery({
    queryKey: [
      'employeeMonthlySalaries',
      ServerSITEMAP.monthlySalaries.get,
      fromDateString
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allMonthlySalaries>>(
        ServerSITEMAP.monthlySalaries.get +
          '?' +
          new URLSearchParams({
            monthStartDate: fromDateString
          } satisfies typeof ServerSITEMAP.monthlySalaries._queries)
      ),
    onError: onErrorDisplayToast
  })

  const {
    isLoading: generateMonthlySalaryLoading,
    mutate: monthlySalaryGenerate
  } = useMutation({
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof generateMonthlySalary>>(
        ServerSITEMAP.monthlySalaries.post,
        {
          method: 'post',
          body: JSON.stringify({
            startDate: fromDateString,
            endDate: toDateString
          } satisfies GetReqBodyType<typeof generateMonthlySalary>)
        }
      ),
    mutationKey: [
      'generateMonthlySalary',
      ServerSITEMAP.attendances.put,
      fromDateString,
      toDateString
    ],
    onSuccess: data => {
      data?.message && addToast(data.message)
      refetch()
      refetchCompanies()
    },
    onError: onErrorDisplayToast,
    retry: false
  })

  const {
    isLoading: withdrawMonthlySalaryLoading,
    mutate: monthlySalaryWithdraw
  } = useMutation({
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof withdrawMonthlySalary>>(
        ServerSITEMAP.monthlySalaries.delete.replace(
          ServerSITEMAP.monthlySalaries._params.start_date,
          fromDateString
        ),
        { method: 'delete' }
      ),
    mutationKey: [
      'withdrawMonthlySalary',
      ServerSITEMAP.monthlySalaries.delete,
      fromDateString
    ],
    onSuccess: data => {
      data?.message && addToast(data.message)
      refetch()
      refetchCompanies()
    },
    onError: onErrorDisplayToast,
    retry: false
  })

  const {
    isLoading: confirmMonthlySalaryLoading,
    mutate: monthlySalaryConfirm
  } = useMutation({
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof confirmMonthlySalary>>(
        ServerSITEMAP.monthlySalaries.putConfirm.replace(
          ServerSITEMAP.monthlySalaries._params.start_date,
          fromDateString
        ),
        { method: 'put' }
      ),
    mutationKey: [
      'confirmMonthlySalary',
      ServerSITEMAP.monthlySalaries.put,
      fromDateString
    ],
    onSuccess: data => {
      data?.message && addToast(data.message)
      refetch()
      refetchCompanies()
    },
    onError: onErrorDisplayToast,
    retry: false
  })

  const { isFetching: monthlySalaryLoading } = useQuery({
    queryKey: [
      'monthlySalary',
      ServerSITEMAP.monthlySalaries.getById,
      monthlySalary.id
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof monthlySalaryDetails>>(
        ServerSITEMAP.monthlySalaries.getById.replace(
          ServerSITEMAP.monthlySalaries._params.id,
          monthlySalary.id.toString()
        )
      ),
    enabled: monthlySalary.id > 0,
    onError: onErrorDisplayToast,
    onSuccess: monthlySalary => monthlySalary && setMonthlySalary(monthlySalary)
  })

  const { mutate: salaryUpdate, isLoading: salaryUpdateLoading } = useMutation({
    mutationKey: [
      'salaryUpdate',
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
      toggleSidebar()
      refetch()
      refetchCompanies()
    }
  })

  const isFetching =
    fetchingMonthlySalaries ||
    fetchingCompanies ||
    generateMonthlySalaryLoading ||
    monthlySalaryLoading ||
    salaryUpdateLoading ||
    withdrawMonthlySalaryLoading ||
    confirmMonthlySalaryLoading

  const employeeMonthlySalaries = useMemo(
    () =>
      _employeeMonthlySalaries.filter(
        ({
          employee: {
            id,
            company: { id: cid }
          }
        }) =>
          (companyId < 1 || cid === companyId) &&
          (self?.type === 'Employee' && self.employeeId
            ? id === self.employeeId
            : true)
      ),
    [_employeeMonthlySalaries, companyId, self]
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
          <Button
            onClick={() =>
              downloadStringAsFile(
                getCsvFromSalaries(employeeMonthlySalaries),
                'employeeSalaries.csv',
                { type: 'text/csv' }
              )
            }
            className='btn-primary'
          >
            Export CSV
          </Button>

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
        <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
          <Button
            disabled={!!employeeMonthlySalaries.length}
            onClick={() => monthlySalaryGenerate()}
            className='btn-primary ms-auto'
          >
            Generate Payment Sheet
          </Button>
          <Button
            disabled={!employeeMonthlySalaries.length}
            onClick={() => monthlySalaryWithdraw()}
            className='btn-primary ms-1'
          >
            Salary Payment Reprocessing
          </Button>
          <Button
            disabled={
              !employeeMonthlySalaries.length ||
              employeeMonthlySalaries[0]?.status === 'Paid'
            }
            onClick={() => monthlySalaryConfirm()}
            className='btn-primary ms-1'
          >
            Confirm Payment
          </Button>
        </ProtectedComponent>
      </div>

      <Table
        columns={[
          'Name',
          'Company',
          'Basic Salary',
          'House Rent',
          'Food Cost',
          'Conveyance',
          'Medical Cost',
          'Gross Salary',
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
          'Status',
          'Action'
        ]}
        rows={employeeMonthlySalaries.map(salary => [
          <Link
            to={ROUTES.payroll.id.replace(
              ROUTE_PARAMS.id,
              salary.employee.id.toString()
            )}
            className='text-decoration-none'
          >
            <EmployeeName employee={salary.employee} />
          </Link>,
          <>{salary.employee.company.name}</>,
          <>{salary.basicSalary}</>,
          <>{salary.houseRent}</>,
          <>{salary.foodCost}</>,
          <>{salary.conveyance}</>,
          <>{salary.medicalCost}</>,
          <>
            {salary.basicSalary +
              salary.foodCost +
              salary.houseRent +
              salary.conveyance +
              salary.medicalCost}
          </>,
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
          <>{salary.status}</>,
          <>
            <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
              <Button
                disabled={isFetching}
                onClick={() => {
                  setMonthlySalary(s => ({ ...s, id: salary.id }))
                  toggleSidebar()
                }}
                className='border-0 link-primary text-body'
              >
                <FaPen />
              </Button>
            </ProtectedComponent>
            <Link
              to={ROUTES.payroll.id.replace(
                ROUTE_PARAMS.id,
                salary.employee.id.toString()
              )}
              className='btn link-primary text-body'
            >
              <FaEye />
            </Link>
          </>
        ])}
      />

      <Modal isOpen={sidebar} setIsOpen={setSidebar}>
        <Modal.Header title='Update Salary' close={toggleSidebar} />
        <Modal.Body>
          {(
            ['status'] satisfies KeysOfObjectOfType<MonthlySalary, string>[]
          ).map(k => (
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
          ))}
          {numericKeys.map(k => (
            <Input
              key={k}
              disabled={isFetching}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={monthlySalary[k]}
              type='number'
              onChange={onMonthlySalaryChange}
            />
          ))}
          {(
            ['paymentMethod'] satisfies KeysOfObjectOfType<
              MonthlySalary,
              string
            >[]
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
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
              <Button
                disabled={isFetching}
                className='btn-primary mx-2'
                onClick={() => salaryUpdate()}
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
            </ProtectedComponent>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default MonthlyPaysheet
