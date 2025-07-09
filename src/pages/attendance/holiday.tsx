import { useMutation, useQuery } from '@tanstack/react-query'
import { useContext, useEffect, useMemo, useState } from 'react'

import CalenderSlider from '../../components/CalenderSlider'
import { BLANK_ARRAY } from '../../constants/CONSTANTS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../contexts/auth'
import { ToastContext } from '../../contexts/toast'
import generateCalender, {
  dateToString,
  getDateRange,
  getWeekData,
  nameOfDays,
  SETTINGS,
  stringToDate
} from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import {
  addHoliday,
  deleteHoliday,
  holidaysByMonth
} from 'backend/controllers/holidays'
import Holiday from 'backend/Entities/Holiday'

// FIXME: duplicate 'PRIMARY'
const HolidayManagement = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)
  const { self } = useContext(AuthContext)
  const [currentDate, setCurrentDate] = useState(new Date())

  const [fromDate, toDate] = useMemo(
    () => getDateRange(currentDate),
    [currentDate]
  )
  const [fromDateString] = useMemo(
    () => [fromDate, toDate].map(dateToString) as [string, string],
    [fromDate, toDate]
  )

  useEffect(
    () => setCurrentDate(stringToDate(fromDateString)),
    [fromDateString]
  )

  const calender = useMemo(
    () => generateCalender(fromDate, toDate),
    [fromDate, toDate]
  )
  const weekData = useMemo(
    () => getWeekData(fromDate, calender),
    [fromDate, calender]
  )

  const {
    refetch,
    data: holidays = BLANK_ARRAY,
    isFetching: holidaysLoading
  } = useQuery({
    queryKey: [
      'holidays',
      ServerSITEMAP.holidays.getByMonthStart,
      fromDateString
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof holidaysByMonth>>(
        ServerSITEMAP.holidays.getByMonthStart.replace(
          ServerSITEMAP.holidays._params.monthStart,
          fromDateString
        )
      ),
    onError: onErrorDisplayToast
  })

  const { mutate: holidayAdd, isLoading: holidayAddLoading } = useMutation({
    mutationKey: ['holidayAdd', ServerSITEMAP.holidays.post],
    mutationFn: (holiday: Holiday) =>
      modifiedFetch<GetResponseType<typeof addHoliday>>(
        ServerSITEMAP.holidays.post,
        { method: 'post', body: JSON.stringify(holiday) }
      ),
    onError: onErrorDisplayToast,
    onSuccess: data => {
      data?.message && addToast(data.message + ': ' + data.data.date)
      refetch()
    }
  })

  const { isLoading: holidayDeleteLoading, mutate: holidayDelete } =
    useMutation({
      mutationFn: (date: string) =>
        modifiedFetch<GetResponseType<typeof deleteHoliday>>(
          ServerSITEMAP.holidays.delete.replace(
            ServerSITEMAP.holidays._params.date,
            date
          ),
          { method: 'delete' }
        ),
      mutationKey: ['deleteHoliday', ServerSITEMAP.holidays.delete],
      onSuccess: data => {
        data?.message && addToast(data.message)
        refetch()
      },
      onError: onErrorDisplayToast,
      retry: false
    })

  const isFetching =
    holidaysLoading || holidayAddLoading || holidayDeleteLoading

  return (
    <>
      <div className='row'>
        <div className='col'>
          <CalenderSlider
            monthly
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          />
        </div>
        <div className='col'>
          {isFetching && (
            <div className='ms-3 spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          )}
        </div>
      </div>

      <div className='d-flex justify-content-center my-2'>
        <table className='mt-3 table table-hover text-center w-75'>
          <thead>
            <tr>
              {nameOfDays.map(name => (
                <th key={name}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekData.map((week, i) => (
              <tr key={i}>
                {week.map((date, index) => {
                  const month =
                    (date < SETTINGS.PAYROLL_CYCLE_START_DATE
                      ? toDate.getMonth()
                      : fromDate.getMonth()) + 1
                  const year =
                    month === 1 ? toDate.getFullYear() : fromDate.getFullYear()
                  const targetDateString = dateToString(
                    new Date(year, month - 1, date)
                  )
                  const holiday =
                    date !== -1
                      ? holidays.find(({ date }) => date === targetDateString)
                      : undefined

                  return (
                    <td
                      role='button'
                      key={index}
                      className={
                        holiday
                          ? isFetching
                            ? 'text-bg-dark bg-opacity-50'
                            : 'text-bg-primary'
                          : ''
                      }
                      onClick={() =>
                        self?.type !== 'Employee' && !isFetching
                          ? holiday
                            ? holidayDelete(targetDateString)
                            : holidayAdd({ date: targetDateString })
                          : undefined
                      }
                    >
                      {date !== -1 ? date : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default HolidayManagement
