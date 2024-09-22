import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'
import { Link } from 'react-router-dom'

import { GetResponseType } from 'backend/@types/response'
import { allEmployees } from 'backend/controllers/employees'

import Table from '../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../constants/CONSTANTS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import modifiedFetch from '../../libs/modifiedFetch'
import { FaPen } from 'react-icons/fa6'

const Notices = () => {
  const { onErrorDisplayToast } = useContext(ToastContext)
  const { data: employees = BLANK_ARRAY, isFetching } = useQuery({
    queryKey: ['employeeAssets', ServerSITEMAP.employees.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployees>>(
        ServerSITEMAP.employees.get
      ),
    onError: onErrorDisplayToast
  })
  return (
    <>
      {isFetching && (
        <div className='ms-3 spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      )}
      <Table
        columns={[
          'Sl.No',
          'Employee Id',
          'Name',
          'Company',
          'Department',
          'Date',
          'Action'
        ]}
        rows={employees
          .filter(employee => employee.noticePeriod !== '0NaN-aN-aN')
          .map(employee => [
            <>{employee.id}</>,
            <>{employee.eId}</>,
            <>{employee.name}</>,
            <>{employee.company.name}</>,
            <>{employee.department.name}</>,
            <>{employee.noticePeriod}</>,
            <Link
              to={ROUTES.employee.details.replace(
                ROUTES.employee._params.id,
                employee.id.toString()
              )}
              className='btn-link'
            >
              <FaPen />
            </Link>
          ])}
      />
    </>
  )
}
export default Notices
