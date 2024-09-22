import { useQuery } from '@tanstack/react-query'
import { useContext, useState, type ChangeEventHandler } from 'react'

import { FaPen, FaPlus } from 'react-icons/fa6'

import Table from '../../components/Table'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import { capitalize } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type Employee from 'backend/Entities/Employee'
import type { allEmployees } from 'backend/controllers/employees'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/CONSTANTS'

const visibleKeys = [
  'photo',
  'eId',
  'name',
  'phoneNumber',
  'email',
  'company',
  'department'
] as (keyof Employee)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const EmployeePage = () => {
  const { onErrorDisplayToast } = useContext(ToastContext)

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const { data: employees, isFetching } = useQuery({
    queryKey: ['employees', ServerSITEMAP.employees.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployees>>(
        ServerSITEMAP.employees.get
      ),
    onError: onErrorDisplayToast
  })

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>Employee</strong>
            </h4>
            <span className='text-primary'>Details</span>
          </div>
          {isFetching && (
            <div className='ms-3 spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          )}
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
        </div>
      </div>

      <Table
        columns={columns}
        rows={(employees || [])
          .filter(employee =>
            visibleKeys.find(key =>
              employee[key]
                ?.toString()
                .toLowerCase()
                .includes(search.toLowerCase())
            )
          )
          .map(employee =>
            visibleKeys
              .map(key => (
                <>
                  {key === 'company' || key === 'department'
                    ? employee[key].name
                    : employee[key]?.toString()?.substring?.(0, 50) +
                      ((employee[key]?.toString().length || 0) > 50
                        ? '...'
                        : '')}
                </>
              ))
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
