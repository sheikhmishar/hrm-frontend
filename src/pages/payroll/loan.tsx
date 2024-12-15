import { useMutation, useQuery } from '@tanstack/react-query'
import {
  useCallback,
  useContext,
  useState,
  type ChangeEventHandler
} from 'react'
import { FaRotateLeft, FaTrash } from 'react-icons/fa6'

import Button from '../../components/Button'
import EmployeeName from '../../components/EmployeeName'
import Input from '../../components/Input'
import Modal from '../../components/Modal'
import Select, { DropDownEventHandler } from '../../components/Select'
import Table from '../../components/Table'
import { BLANK_ARRAY } from '../../constants/CONSTANTS'
import { defaultLoan } from '../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../contexts/auth'
import { ToastContext } from '../../contexts/toast'
import { capitalizeDelim, getEmployeeId } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import Employee from 'backend/Entities/Employee'
import Loan from 'backend/Entities/Loan'
import { allEmployees } from 'backend/controllers/employees'
import { addLoan, allLoans, deleteLoan } from 'backend/controllers/loans'

const Assigned = () => {
  const { self } = useContext(AuthContext)
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [loan, setLoan] = useState<Loan>({ ...defaultLoan })
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

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setLoan(loan => ({ ...loan, id: -1 }))
      return !sidebar
    })
  const resetData = () => setLoan({ ...defaultLoan })

  const {
    data: loans = BLANK_ARRAY,
    isFetching: fetchingLoans,
    refetch
  } = useQuery({
    queryKey: ['loans', ServerSITEMAP.loans.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allLoans>>(ServerSITEMAP.loans.get),
    onError: onErrorDisplayToast
  })

  const {
    data: employees = BLANK_ARRAY,
    isFetching: fetchingEmployees,
    refetch: refetchEmployees
  } = useQuery({
    queryKey: ['employees', ServerSITEMAP.employees.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployees>>(
        ServerSITEMAP.employees.get
      ),
    onError: onErrorDisplayToast
  })

  const { isLoading, mutate: loanDelete } = useMutation({
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
      refetchEmployees()
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
    },
    retry: false
  })

  const isFetching = fetchingLoans || fetchingEmployees || loanCreateLoading

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

      <Table
        columns={['Employee', 'Company', 'Date', 'Amount', 'Action']}
        rows={loans
          .filter(({ id }) =>
            self?.type === 'Employee' && self.employeeId
              ? id === self.employeeId
              : true
          )
          .reduce(
            (prev, employee) =>
              prev.concat(
                // FIXME: undefined
                employee.loans?.map(loan => [
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
                  <>{employee.company.name}</>,
                  <>{loan.date}</>,
                  <>{loan.amount}</>,
                  <Button
                    disabled={isLoading || self?.type === 'Employee'}
                    onClick={() => loanDelete(loan.id)}
                    className='link-primary text-body'
                  >
                    <FaTrash />
                  </Button>
                ])
              ),
            [] as JSX.Element[][]
          )}
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
                options={employees.map(employee => ({
                  value: employee.id,
                  label: `${getEmployeeId(employee)} - ${employee.name}`
                }))}
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
