import { useQuery } from '@tanstack/react-query'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

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

// TODO: 09 -> September, legend

const LeaveCalender = () => {
  const { onErrorDisplayToast } = useContext(ToastContext)

  const [companyId, setCompanyId] = useState(-1)
  const [currentDate, setCurrentDate] = useState(new Date())

  const [fromDate, toDate] = useMemo(
    () => getDateRange(currentDate),
    [currentDate]
  )
  const [fromDateString, toDateString] = useMemo(
    () =>
      [fromDate, toDate].map(date => date.toISOString().split('T')[0]) as [
        string,
        string
      ],
    [fromDate, toDate]
  )

  useEffect(() => setCurrentDate(new Date(fromDateString)), [fromDateString])

  const { data: employeeLeaves = BLANK_ARRAY, isFetching } = useQuery({
    queryKey: [
      'employeeLeaves',
      ServerSITEMAP.leaves.get,
      fromDateString,
      toDateString
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployeeLeaves>>(
        ServerSITEMAP.leaves.get +
          '?' +
          new URLSearchParams({
            from: fromDateString,
            to: toDateString
          } satisfies Partial<typeof ServerSITEMAP.attendances._queries>)
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
          calender.map(({ date }, i) =>
            calender[i + 1]?.date === '01' ? date + ' | ' : date
          )
        )}
        rows={[
          [<></>].concat(
            calender.map(({ date, month }, i) => (
              <strong className='text-primary'>
                {date.endsWith('22') || date.endsWith('07')
                  ? new Date(`2011-${month}-01`).toDateString().substring(4, 7)
                  : ''}
                {calender[i + 1]?.date === '01' ? (
                  <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| </>
                ) : (
                  ''
                )}
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
                  const year =
                    month === '01'
                      ? toDate.getFullYear()
                      : fromDate.getFullYear()
                  const targetDate = new Date(`${year}-${month}-${date}`)

                  // FIXME: undefined sometimes
                  const leave = employee.leaves.find(
                    leave =>
                      new Date(leave.from) <= targetDate &&
                      new Date(leave.to) >= targetDate
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
