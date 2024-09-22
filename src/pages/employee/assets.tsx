import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'

import Input from '../../components/Input'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import { allEmployeeAssets } from 'backend/controllers/employees'
import { BLANK_ARRAY } from '../../constants/CONSTANTS'

const Assets = () => {
  const { onErrorDisplayToast } = useContext(ToastContext)
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
        />
        {isFetching && (
          <div className='ms-3 spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        )}
      </div>
      {employees.map(employee => (
        <div key={employee.id} className='col-12 my-2'>
          <div className='border-0 card shadow-sm'>
            <div className='card-body'>
              <div className='align-items-center d-flex gap-3 my-3'>
                <img
                  src='/favicon.png'
                  alt=''
                  className='cursor-pointer object-fit-cover rounded-circle'
                  height='60'
                  width='60'
                />
                <div>
                  <p className='fw-bold m-0 rounded-3 text-info'>
                    {employee.name}
                  </p>
                  <p className='m-0'>{employee.company.name}</p>
                  <p className='m-0'>{employee.eId}</p>
                </div>
              </div>
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
