import { useQuery } from '@tanstack/react-query'
import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'

import EmployeeName from '../../components/EmployeeName'
import Input from '../../components/Input'
import { BLANK_ARRAY, ROUTES } from '../../constants/CONSTANTS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../contexts/auth'
import { ToastContext } from '../../contexts/toast'
import { getEmployeeId } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import { allEmployeeAssets } from 'backend/controllers/employees'

const Assets = () => {
  const { self } = useContext(AuthContext)
  const { onErrorDisplayToast } = useContext(ToastContext)

  const [search, setSearch] = useState('')

  const { data: employees = BLANK_ARRAY, isFetching } = useQuery({
    queryKey: ['employeeAssets', ServerSITEMAP.employees.getAssets],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployeeAssets>>(
        ServerSITEMAP.employees.getAssets
      ),
    onError: onErrorDisplayToast
  })

  return (
    <div className='row'>
      <div className='col-12 col-md-7'>
        <Input
          id='search'
          containerClass='my-3'
          placeholder='Search Employee by Id, Name or Asset'
          label=''
          value={search}
          onChange={({ target: { value } }) => setSearch(value)}
        />
        {isFetching && (
          <div className='ms-3 spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        )}
      </div>
      {employees
        .filter(
          employee =>
            (employee.name.toLowerCase().includes(search.toLowerCase()) ||
              getEmployeeId(employee).includes(search) ||
              employee.assets.find(asset =>
                asset.name.toLowerCase().includes(search.toLowerCase())
              )) &&
            (self?.type === 'Employee' && self.employeeId
              ? employee.id === self.employeeId
              : true)
        )
        .map(employee => (
          <div key={employee.id} className='col-12 my-2'>
            <div className='border-0 card shadow-sm'>
              <div className='card-body'>
                <Link
                  className='text-decoration-none'
                  role='button'
                  to={ROUTES.employee.details.replace(
                    ROUTES.employee._params.id,
                    employee.id.toString()
                  )}
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
                </Link>
                <table className='mt-2 table table-borderless'>
                  <thead>
                    <tr>
                      <th className='text-warning'>Asset Name</th>
                      <th className='text-warning'>Description</th>
                      <th className='text-warning'>Given Date</th>
                      <th className='text-warning'>Return Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.assets.map(asset => (
                      <tr key={asset.id}>
                        <td>{asset.name}</td>
                        <td>{asset.description}</td>
                        <td>{asset.givenDate}</td>
                        <td>{asset.returnDate || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}

export default Assets
