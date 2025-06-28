import { useQuery } from '@tanstack/react-query'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js'
import { useContext, useMemo, useState } from 'react'
import { Bar, Pie } from 'react-chartjs-2'
import { Link } from 'react-router-dom'

import iconAbsentEmployee from '../assets/img/dashboard/absent_employees.png' // TODO: iconify
import iconLeaveEmployee from '../assets/img/dashboard/leave_employees.png'
import iconPresentEmployee from '../assets/img/dashboard/present_employees.png'
import iconTotalEmployee from '../assets/img/dashboard/total_employees.png'
import CalenderDropdown from '../components/CalenderSlider'
import EmployeeName from '../components/EmployeeName'
import Select, { type DropDownEventHandler } from '../components/Select'
import Table from '../components/Table'
import { BLANK_ARRAY, ROUTES } from '../constants/CONSTANTS'
import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import { ToastContext } from '../contexts/toast'
import { dateToString, getDateRange, stringToDate } from '../libs'
import modifiedFetch from '../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import Employee from 'backend/Entities/Employee'
import { companyWiseAttendance } from 'backend/controllers/attendances'
import { allCompanies } from 'backend/controllers/companies'
import { allMonthlySalaries } from 'backend/controllers/monthly-salaries'

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  ArcElement
)

const CSSFilter = 'hue-rotate(66deg)' 

const rootElement = document.getElementById('root')!

const Dashboard: React.FC = () => {
  const { onErrorDisplayToast } = useContext(ToastContext)

  const [currentDate, setCurrentDate] = useState(new Date())
  const currentDateString = useMemo(
    () => dateToString(currentDate),
    [currentDate]
  )
  const [fromDate] = useMemo(
    () => getDateRange(stringToDate(currentDateString)),
    [currentDateString]
  )
  const [fromDateString] = useMemo(
    () => [fromDate].map(dateToString) as [string],
    [fromDate]
  )

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

  const { data: _attendances = BLANK_ARRAY, isFetching: fetchingAttendances } =
    useQuery({
      queryKey: [
        'companyWiseAttendances',
        ServerSITEMAP.attendances.getCompanyWise,
        currentDateString
      ],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof companyWiseAttendance>>(
          ServerSITEMAP.attendances.getCompanyWise +
            '?' +
            new URLSearchParams({ date: currentDateString } satisfies Partial<
              typeof ServerSITEMAP.attendances._queries
            >)
        ),
      onError: onErrorDisplayToast
    })

  const {
    data: employeeMonthlySalaries = BLANK_ARRAY,
    isFetching: fetchingMonthlySalaries
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

  const companyAttendances = useMemo(
    () => _attendances.filter(({ id }) => companyId === -1 || companyId === id), // TODO: all
    [_attendances, companyId]
  )

  const totalEmployees = useMemo(
    () =>
      companyAttendances.reduce(
        (total, { employees: { length } }) => total + length,
        0
      ),
    [companyAttendances]
  )

  const presentEmployees = useMemo(
    () =>
      companyAttendances.reduce(
        (total, { employees }) =>
          total +
          employees.reduce(
            (total, { attendances: { length } }) => total + length,
            0
          ),
        0
      ),
    [companyAttendances]
  )

  const leaveEmployees = useMemo(
    () =>
      companyAttendances.reduce(
        (total, { employees }) =>
          total +
          employees.reduce(
            (total, { leaves: { length } }) => total + length,
            0
          ),
        0
      ),
    [companyAttendances]
  )

  const paid = useMemo(
    () =>
      employeeMonthlySalaries.filter(({ status }) => status === 'Paid').length,
    [employeeMonthlySalaries]
  )
  const unpaid = useMemo(
    () =>
      employeeMonthlySalaries.filter(({ status }) => status === 'Unpaid')
        .length,
    [employeeMonthlySalaries]
  )
  const isFetching =
    companiesFetching || fetchingAttendances || fetchingMonthlySalaries

  return (
    <>
      <div className='border-0 card my-2 shadow-sm'>
        <div className='card-body'>
          <div className='row'>
            <div className='align-items-center d-flex flex-wrap gap-2 justify-content-between mb-3'>
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
              <CalenderDropdown
                className='ms-auto'
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
              />
            </div>
          </div>
          <div className='row'>
            <div className='align-items-center col-6 col-md-3 d-flex gap-3 text-muted'>
              <img
                className='img-fluid'
                style={{ filter: CSSFilter }}
                src={iconTotalEmployee}
                width='42'
                alt='totalEmployees'
              />
              <div>
                <p className='mb-0 mt-2'>Total Employee</p>
                <p className='fs-5 fw-bold text-dark'>{totalEmployees}</p>
              </div>
            </div>
            <div className='align-items-center col-6 col-md-3 d-flex gap-3 text-muted'>
              <img
                className='img-fluid'
                style={{ filter: CSSFilter }}
                src={iconPresentEmployee}
                width='42'
                alt='presentEmployees'
              />
              <div>
                <p className='mb-0 mt-2'>Present Today</p>
                <p className='fs-5 fw-bold text-dark'>{presentEmployees}</p>
              </div>
            </div>
            <div className='align-items-center col-6 col-md-3 d-flex gap-3 text-muted'>
              <img
                className='img-fluid'
                style={{ filter: CSSFilter }}
                src={iconAbsentEmployee}
                width='42'
                alt='absentEmployees'
              />
              <div>
                <p className='mb-0 mt-2'>Absent Today</p>
                <p className='fs-5 fw-bold text-dark'>
                  {totalEmployees - presentEmployees - leaveEmployees}
                </p>
              </div>
            </div>
            <div className='align-items-center col-6 col-md-3 d-flex gap-3 text-muted'>
              <img
                className='img-fluid'
                style={{ filter: CSSFilter }}
                src={iconLeaveEmployee}
                width='42'
                alt='leaveEmployees'
              />
              <div>
                <p className='mb-0 mt-2'>On Leave</p>
                <p className='fs-5 fw-bold text-dark'>{leaveEmployees}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='row'>
        <div className='col-12 col-lg-8'>
          <div className='h-100 position-relative row'>
            <div className='col-12 mt-3'>
              <div className='border-0 card h-100 shadow-sm'>
                <div className='card-body'>
                  <div className='d-flex w-100'>
                    <h5 className='mb-0 mr-2 my-2 text-muted'>
                      <strong>Company wise attendance</strong>
                    </h5>
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
                      labels: companyAttendances.map(({ name }) =>
                        name.substring(0, 16)
                      ),
                      datasets: [
                        {
                          label: 'Present',
                          data: companyAttendances.map(({ employees }) =>
                            employees.reduce(
                              (total, { attendances }) =>
                                total + attendances.length,
                              0
                            )
                          ),
                          backgroundColor: `rgb(${getComputedStyle(
                            rootElement
                          ).getPropertyValue('--bs-primary-rgb')})`
                        },
                        {
                          label: 'Absent',
                          data: companyAttendances.map(
                            ({ employees }) =>
                              employees.length -
                              employees.reduce(
                                (total, { attendances, leaves }) =>
                                  total + attendances.length + leaves.length,
                                0
                              )
                          ),
                          backgroundColor: `rgb(${getComputedStyle(
                            rootElement
                          ).getPropertyValue('--bs-primary-rgb-dark')})`
                        },
                        {
                          label: 'Leave',
                          data: companyAttendances.map(({ employees }) =>
                            employees.reduce(
                              (total, { leaves: { length } }) => total + length,
                              0
                            )
                          ),
                          backgroundColor: `rgb(${getComputedStyle(
                            rootElement
                          ).getPropertyValue('--bs-secondary-rgb')})`
                        }
                      ]
                    }}
                  />
                </div>
              </div>
            </div>
            <div className='col-12 col-md-6 mt-4'>
              <div className='border-0 card h-100 shadow-sm'>
                <div className='card-body'>
                  <h5 className='mb-0 mr-2 my- text-muted'>
                    <strong>Employees on Leave</strong>
                  </h5>
                  <div className='row'>
                    <Table
                      contCls=' '
                      columns={['']}
                      rows={companyAttendances
                        .reduce(
                          (prev, { employees }) =>
                            prev.concat(
                              employees.filter(
                                ({ leaves: { length } }) => length
                              )
                            ),
                          [] as Employee[]
                        )
                        .map(employee => [
                          <Link
                            role='button'
                            to={
                              ROUTES.leave.details.replace(
                                ROUTES.leave._params.id,
                                employee.id.toString()
                              ) +
                              '?' +
                              new URLSearchParams({
                                month: fromDateString
                              } satisfies typeof ROUTES.leave._queries)
                            }
                            className='text-decoration-none'
                          >
                            <EmployeeName employee={employee} />
                          </Link>
                        ])}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className='col-12 col-md-6 mt-4'>
              <div className='border-0 card h-100 shadow-sm'>
                <div className='card-body'>
                  <Pie
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: {
                            boxWidth: 30,
                            boxHeight: 20,
                            usePointStyle: true
                          }
                        }
                      }
                    }}
                    data={{
                      labels: ['Paid', 'Unpaid'],
                      datasets: [
                        {
                          data: [
                            paid || unpaid ? paid : 1,
                            paid || unpaid ? unpaid : 1
                          ],
                          backgroundColor: [
                            paid
                              ? `rgb(${getComputedStyle(
                                  rootElement
                                ).getPropertyValue('--bs-primary-rgb')})`
                              : '#000',
                            unpaid
                              ? `rgb(${getComputedStyle(
                                  rootElement
                                ).getPropertyValue('--bs-secondary-rgb')})`
                              : '#000'
                          ],
                          borderColor:
                            paid || unpaid
                              ? [
                                  `rgb(${getComputedStyle(
                                    rootElement
                                  ).getPropertyValue('--bs-primary-rgb')})`,
                                  `rgb(${getComputedStyle(
                                    rootElement
                                  ).getPropertyValue('--bs-primary-rgb')})`
                                ]
                              : ['#000', '#000'],
                          borderWidth: 1
                        }
                      ]
                    }}
                  />
                  <h6 className='mt-4 text-primary'>Paid: {paid}</h6>
                  <h6 className='text-secondary'>Unpaid: {unpaid}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='col-12 col-lg-4 mt-3'>
          <div className='border-0 card h-100 shadow-sm'>
            <div className='card-body'>
              <h5 className='mb-0 mr-2 my-2 text-muted'>
                <strong>Absent Employees</strong>
              </h5>
              <div className='row'>
                <Table
                  contCls=' '
                  columns={['']}
                  rows={companyAttendances
                    .reduce(
                      (prev, { employees }) =>
                        prev.concat(
                          employees.filter(
                            ({ leaves, attendances }) =>
                              !leaves.length && !attendances.length
                          )
                        ),
                      [] as Employee[]
                    )
                    .map(employee => [
                      <Link
                        to={
                          ROUTES.attendance.details.replace(
                            ROUTES.attendance._params.id,
                            employee.id.toString()
                          ) +
                          '?' +
                          new URLSearchParams({
                            month: fromDateString
                          } satisfies typeof ROUTES.attendance._queries)
                        }
                        className='text-decoration-none'
                      >
                        <EmployeeName employee={employee} />
                      </Link>
                    ])}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default Dashboard
