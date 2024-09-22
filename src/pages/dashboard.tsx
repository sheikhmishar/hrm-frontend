import { useQuery } from '@tanstack/react-query'
import {
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js'
import { useContext, useState } from 'react'
import { Bar } from 'react-chartjs-2'

import Select, { type DropDownEventHandler } from '../components/Select'
import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import { ToastContext } from '../contexts/toast'
import modifiedFetch from '../libs/modifiedFetch'
// TODO: iconify
import iconAbsentEmployee from '../assets/img/dashboard/absent_employees.png'
import iconLeaveEmployee from '../assets/img/dashboard/leave_employees.png'
import iconPresentEmployee from '../assets/img/dashboard/present_employees.png'
import iconTotalEmployee from '../assets/img/dashboard/total_employees.png'

import { GetResponseType } from 'backend/@types/response'
import { allCompanies } from 'backend/controllers/companies'
import { BLANK_ARRAY } from '../constants/CONSTANTS'
import FullCalenderSlider from '../components/FullCalenderSlider'

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale
)

const Dashboard: React.FC = () => {
  const { onErrorDisplayToast } = useContext(ToastContext)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [companyId, setCompanyId] = useState(-1)
  const onCompanySelect: DropDownEventHandler = ({ target: { value } }) =>
    setCompanyId(parseInt(value))

  const { data: companies = BLANK_ARRAY, isFetching: companiesFetching } =
    useQuery({
      queryKey: ['companies', ServerSITEMAP.companies.get],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof allCompanies>>(
          ServerSITEMAP.companies.get
        ),
      onError: onErrorDisplayToast
    })

  const isFetching = companiesFetching

  return (
    <>
      <div className='border-0 card my-2 shadow-sm'>
        <div className='card-body'>
          <div className='row'>
            <div className='align-items-center col-6 col-lg-4 d-flex'>
              <Select
                id='company'
                disabled={isFetching}
                autoComplete='true'
                label='Selected Company'
                containerClass='my-3 '
                placeholder='Enter Company'
                value={companyId}
                options={[{ label: 'All', value: -1 }].concat(
                  companies.map(({ id, name }) => ({
                    value: id,
                    label: name
                  }))
                )}
                onChange={onCompanySelect}
              />
              {isFetching && (
                <div className='ms-3 spinner-border text-primary' role='status'>
                  <span className='visually-hidden'>Loading...</span>
                </div>
              )}
            </div>
          </div>
          <div className='row'>
            <div className='align-items-center col-6 col-md-3 d-flex gap-3 text-muted'>
              <img
                className='img-fluid'
                src={iconTotalEmployee}
                width='42'
                alt='totalEmployees'
              />
              <div>
                <p className='mb-0 mt-2'>Total Employee</p>
                <p className='fs-5 fw-bold text-dark'>13</p>
              </div>
            </div>
            <div className='align-items-center col-6 col-md-3 d-flex gap-3 text-muted'>
              <img
                className='img-fluid'
                src={iconPresentEmployee}
                width='42'
                alt='presentEmployees'
              />
              <div>
                <p className='mb-0 mt-2'>Present Today</p>
                <p className='fs-5 fw-bold text-dark'>0</p>
              </div>
            </div>
            <div className='align-items-center col-6 col-md-3 d-flex gap-3 text-muted'>
              <img
                className='img-fluid'
                src={iconAbsentEmployee}
                width='42'
                alt='absentEmployees'
              />
              <div>
                <p className='mb-0 mt-2'>Absent Today</p>
                <p className='fs-5 fw-bold text-dark'>13</p>
              </div>
            </div>
            <div className='align-items-center col-6 col-md-3 d-flex gap-3 text-muted'>
              <img
                className='img-fluid'
                src={iconLeaveEmployee}
                width='42'
                alt='leaveEmployees'
              />
              <div>
                <p className='mb-0 mt-2'>On Leave</p>
                <p className='fs-5 fw-bold text-dark'>13</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='row'>
        <div className='col-12 col-lg-8'>
          <div className='row'>
            <div className='col-12 my-2'>
              <div className='border-0 card shadow-sm'>
                <div className='card-body'>
                  <div className='d-flex w-100'>
                    <h4 className='mb-0 mr-2 my-2 text-muted'>
                      <strong>Company wise attendance</strong>
                    </h4>
                    <FullCalenderSlider
                      className='ms-auto'
                      currentDate={currentDate}
                      setCurrentDate={setCurrentDate}
                    />
                  </div>

                  <p className='text-muted'>Employee Number</p>
                  <Bar
                    options={{
                      scales: { x: { grid: { display: false } } },
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 30,
                            boxHeight: 20,
                            usePointStyle: true
                          }
                        },
                        title: { display: false }
                      }
                    }}
                    data={{
                      labels: ['a', 'b', 'c'],
                      datasets: [
                        {
                          label: 'Present',
                          data: [1, 1, 1],
                          backgroundColor: '#116384'
                        },
                        {
                          label: 'Absent',
                          data: [6, 7, 9],
                          backgroundColor: '#54C5D0'
                        },
                        {
                          label: 'Leave',
                          data: [1, 4, 6],
                          backgroundColor: '#F47426'
                        }
                      ]
                    }}
                  />
                </div>
              </div>
            </div>
            <div className='col-12 col-md-6 my-2'>
              <div className='border-0 card shadow-sm'>
                <div className='card-body'>abs</div>
              </div>
            </div>
            <div className='col-12 col-md-6 my-2'>
              <div className='border-0 card shadow-sm'>
                <div className='card-body'>sal</div>
              </div>
            </div>
          </div>
        </div>
        <div className='col-12 col-lg-4 my-2'>
          <div className='border-0 card h-100 shadow-sm'>
            <div className='card-body'>leave</div>
          </div>
        </div>
      </div>
    </>
  )
}
export default Dashboard
