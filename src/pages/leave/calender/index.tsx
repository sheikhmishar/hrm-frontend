import { useQuery } from '@tanstack/react-query'
import { useContext, useEffect, useMemo, useState } from 'react'

import CalenderSlider from '../../../components/CalenderDropdown'
import Select from '../../../components/Select'
import Table from '../../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../../constants/CONSTANTS'
import ServerSITEMAP from '../../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../../contexts/toast'
import generateCalender, { getDateRange } from '../../../libs'
import modifiedFetch from '../../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import { allCompanies } from 'backend/controllers/companies'
import { allEmployeeLeaves } from 'backend/controllers/leaves'
import { Link } from 'react-router-dom'

// TODO: 09 -> September, legend

const LeaveCalender = () => {
  const { onErrorDisplayToast } = useContext(ToastContext)

  const [companyId, setCompanyId] = useState(-1)
  const [currentDate, setCurrentDate] = useState(new Date())

  const [fromDate, toDate] = useMemo(
    () => getDateRange(currentDate),
    [currentDate]
  )
  const fromDateString = useMemo(
    () => fromDate.toISOString().split('T')[0]!,
    [fromDate]
  )

  useEffect(() => setCurrentDate(new Date(fromDateString)), [fromDateString])

  const { data: employeeLeaves = BLANK_ARRAY, isFetching } = useQuery({
    queryKey: ['employeeLeaves', ServerSITEMAP.leaves.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployeeLeaves>>(
        ServerSITEMAP.leaves.get
      ),
    onError: onErrorDisplayToast
  })

  const { data: companies = BLANK_ARRAY, isFetching: fetchingCompanies } =
    useQuery({
      queryKey: ['companies', ServerSITEMAP.companies.get],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof allCompanies>>(
          ServerSITEMAP.companies.get
        ),
      onError: onErrorDisplayToast
    })

  const calender = useMemo(
    () => generateCalender(fromDate, toDate),
    [fromDate, toDate]
  )

  return (
    <>
      <div className='mb-3 row'>
        <div className='col-4'>
          <CalenderSlider
            monthly
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          />
        </div>
        <div className='col-2'>
          <Select
            id='company'
            label=''
            value={companyId}
            onChange={({ target: { value } }) =>
              setCompanyId(parseInt(value) || -1)
            }
            options={[{ label: 'All', value: -1 }].concat(
              companies.map(company => ({
                label: company.name,
                value: company.id
              }))
            )}
          />
        </div>
        <div className='col-2'>
          {(isFetching || fetchingCompanies) && (
            <div className='ms-3 spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          )}
        </div>
      </div>
      <Table
        columns={['Employee'].concat(
          calender.map(({ date }) => (date === '01' ? ' |  01' : date))
        )}
        rows={[
          [<></>].concat(
            calender.map(({ date, month }) => (
              <strong className='text-primary'>
                {date.endsWith('21') || date.endsWith('07') ? month : ''}
                {date.endsWith('01') ? '|' : ''}
              </strong>
            ))
          )
        ]
          .concat([
            [<></>].concat(
              calender.map(({ dayName }) => (
                <span style={{ fontSize: 12 }} className='text-info'>
                  {dayName}
                </span>
              ))
            )
          ])
          .concat(
            employeeLeaves.map(employee =>
              [
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
                  className='align-items-center d-flex gap-2 py-2 text-decoration-none'
                >
                  <img
                    src='/favicon.png'
                    width='50'
                    height='50'
                    className='object-fit-cover rounded-circle'
                  />
                  <div>
                    <p
                      style={{ fontSize: 12 }}
                      className='fw-lighter m-0 text-info'
                    >
                      {employee.email}
                    </p>
                    <p className='fw-bold m-0 text-nowrap'>{employee.name}</p>
                    <p
                      style={{ fontSize: 12 }}
                      className='fw-lighter m-0 text-muted'
                    >
                      {employee.designation.name}
                    </p>
                  </div>
                </Link>
              ].concat(
                calender.map(({ month, date }) => {
                  const d = new Date(
                    `${currentDate.getFullYear()}-${month}-${date}`
                  )
                  const leave = employee.leaves.find(
                    leave =>
                      new Date(leave.from) <= d && new Date(leave.to) >= d
                  )
                  if (leave)
                    return (
                      <div
                        className={
                          leave.duration === 'fullday'
                            ? 'bg-primary'
                            : 'bg-secondary'
                        }
                        style={{ height: 50, width: 20 }}
                      />
                    )
                  return <></>
                })
              )
            )
          )}
      />
    </>
  )
}

export default LeaveCalender
