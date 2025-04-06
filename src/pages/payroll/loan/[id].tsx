import { useMutation, useQuery } from '@tanstack/react-query'
import {
  useCallback,
  useContext,
  useEffect,
  useState,
  type ChangeEventHandler
} from 'react'
import { FaRotateLeft, FaTrash } from 'react-icons/fa6'
import { useParams } from 'react-router-dom'

import Button from '../../../components/Button'
import EmployeeName from '../../../components/EmployeeName'
import Input from '../../../components/Input'
import Modal from '../../../components/Modal'
import Select, { DropDownEventHandler } from '../../../components/Select'
import Table from '../../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../../constants/CONSTANTS'
import { defaultLoan } from '../../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../../contexts/auth'
import { ToastContext } from '../../../contexts/toast'
import { capitalizeDelim, getEmployeeId } from '../../../libs'
import modifiedFetch from '../../../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type Employee from 'backend/Entities/Employee'
import type Loan from 'backend/Entities/Loan'
import type {
  addLoan,
  deleteLoan,
  loanByEmployee
} from 'backend/controllers/loans'
import type { allSalariesByEmployee } from 'backend/controllers/monthly-salaries'

const Assigned = () => {
  const { self } = useContext(AuthContext)
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [id, setId] = useState(-1)
  const { id: idFromParam = '-1' } =
    useParams<(typeof ROUTES)['attendance']['_params']>()

  console.log(id, idFromParam)

  const [loan, setLoan] = useState<Loan>({
    ...defaultLoan,
    employee: { ...defaultLoan.employee, id }
  })
  const onLoanChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value, valueAsNumber }
  }) =>
    setLoan(loan => ({
      ...loan,
      [id]: (
        ['amount'] satisfies KeysOfObjectOfType<Loan, number>[] as string[]
      ).includes(id)
        ? valueAsNumber
        : value
    }))
  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { value } }) =>
      setLoan(loan => ({
        ...loan,
        employee: { ...loan.employee, id: parseInt(value) }
      })),
    []
  )

  useEffect(() => {
    let id = -1
    if (self?.type === 'Employee' && self.employeeId) id = self.employeeId
    else id = parseInt(idFromParam) || -1

    setId(id)
    setLoan(loan => ({ ...loan, employee: { ...loan.employee, id } }))
  }, [self, idFromParam])

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setLoan(loan => ({ ...loan, id: -1 }))
      return !sidebar
    })
  const resetData = () =>
    setLoan({ ...defaultLoan, employee: { ...defaultLoan.employee, id } })

  const {
    data: loanEmployee,
    isFetching: fetchingLoans,
    refetch
  } = useQuery({
    queryKey: ['loans', ServerSITEMAP.loans.getByEmployeeId, id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof loanByEmployee>>(
        ServerSITEMAP.loans.getByEmployeeId.replace(
          ServerSITEMAP.loans._params.employeeId,
          id.toString()
        )
      ),
    enabled: id > 0,
    onError: onErrorDisplayToast
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
    enabled: id > 0
  })

  const { isLoading: loanDeleteLoading, mutate: loanDelete } = useMutation({
    mutationFn: (id: number) =>
      modifiedFetch<GetResponseType<typeof deleteLoan>>(
        ServerSITEMAP.loans.delete.replace(
          ServerSITEMAP.loans._params.id,
          id.toString()
        ),
        { method: 'delete' }
      ),
    mutationKey: ['deleteLoan', ServerSITEMAP.loans.delete],
    onSuccess: data => {
      data?.message && addToast(data.message)
      refetch()
      refetchEmployeeMonthlySalaries()
    },
    onError: onErrorDisplayToast,
    retry: false
  })

  const { mutate: loanCreate, isLoading: loanCreateLoading } = useMutation({
    mutationKey: ['loanCreate', ServerSITEMAP.loans.post, loan],
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof addLoan>>(ServerSITEMAP.loans.post, {
        method: 'post',
        body: JSON.stringify(loan)
      }),
    onError: onErrorDisplayToast,
    onSuccess: data => {
      data?.message && addToast(data.message)
      toggleSidebar()
      refetch()
      refetchEmployeeMonthlySalaries()
    },
    retry: false
  })

  const isFetching =
    fetchingLoans ||
    loanCreateLoading ||
    loanDeleteLoading ||
    employeeMonthlySalaryLoading

  return (
    <>
      <div className='align-items-center d-flex gap-2 justify-content-between mb-3'>
        {isFetching && (
          <div className='ms-3 spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        )}
        <Button
          onClick={() => {
            toggleSidebar()
            resetData()
          }}
          className='btn-primary ms-auto'
        >
          + Add loan
        </Button>
      </div>

      <h5 className='text-muted'>
        <strong>Loan Summary:</strong>
      </h5>

      {loanEmployee && (
        <div className='mb-3 row text-muted'>
          <div className='col-6 my-1'>
            <EmployeeName employee={loanEmployee} />
          </div>
          <div className='align-items-end col-6 d-flex flex-column my-1'>
            <h6>
              Taken: <strong>{loanEmployee.loanTaken.toFixed(2)}</strong>
            </h6>
            <h6>
              Paid:{' '}
              <strong>
                {(loanEmployee.loanTaken - loanEmployee.loanRemaining).toFixed(
                  2
                )}
              </strong>
            </h6>
            <h6>
              Due: <strong>{loanEmployee.loanRemaining.toFixed(2)}</strong>
            </h6>
          </div>
        </div>
      )}

      <h5 className='mb-3 text-muted'>
        <strong>Loan History:</strong>
      </h5>
      <Table
        columns={['Date', 'Amount', 'Action']}
        rows={
          loanEmployee
            ? // FIXME: || []
              (loanEmployee.loans || []).map(loan => [
                <>{loan.date}</>,
                <>{loan.amount}</>,
                <Button
                  disabled={isFetching || self?.type === 'Employee'}
                  onClick={() => loanDelete(loan.id)}
                  className='link-primary text-body'
                >
                  {/* TODO: onclick delete previous payments */}
                  <FaTrash />
                </Button>
              ])
            : []
        }
      />

      <h5 className='my-3 text-muted'>
        <strong>Loan Installment History:</strong>
      </h5>
      <Table
        columns={['Date', 'Amount']}
        rows={employeeMonthlySalaries
          .filter(salary => salary.loanDeduction > 0)
          .map(salary => [
            <>{salary.monthStartDate}</>,
            <>{salary.loanDeduction}</>
          ])}
      />

      <Modal isOpen={sidebar} setIsOpen={setSidebar}>
        <Modal.Header title='Add Loan' close={toggleSidebar} />
        <Modal.Body>
          {(['employee'] satisfies KeysOfObjectOfType<Loan, Employee>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={isFetching}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={loan[k].id}
                options={[
                  {
                    value: loanEmployee?.id || '',
                    label: `${
                      loanEmployee ? getEmployeeId(loanEmployee) : ''
                    } - ${loanEmployee?.name}`
                  }
                ]}
                onChange={onSelectChange}
              />
            )
          )}
          {(['date'] satisfies KeysOfObjectOfType<Loan, string>[]).map(k => (
            <Input
              key={k}
              disabled={isFetching}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              type='date'
              value={loan[k]}
              onChange={onLoanChange}
            />
          ))}
          {(['amount'] satisfies KeysOfObjectOfType<Loan, number>[]).map(k => (
            <Input
              key={k}
              disabled={isFetching}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              type='number'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={loan[k]}
              onChange={onLoanChange}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            {loan.id === -1 && (
              <Button className='btn-light mx-2' onClick={resetData}>
                <FaRotateLeft />
              </Button>
            )}
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={isFetching}
              className='btn-primary mx-2'
              onClick={() => loanCreate()}
            >
              <span className='align-items-center d-flex'>
                {loan.id > 0 ? 'Update' : 'Add'}
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
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Assigned
