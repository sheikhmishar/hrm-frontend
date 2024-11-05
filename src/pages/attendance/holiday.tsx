import { useContext, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { ToastContext } from '../../contexts/toast'
import generateCalender, { getDateRange, getWeekData } from '../../libs'
import CalenderSlider from '../../components/CalenderDropdown'
import { BLANK_ARRAY } from '../../constants/CONSTANTS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import {
  addHoliday,
  deleteHoliday,
  holidaysByMonth
} from 'backend/controllers/holidays'
import Holiday from 'backend/Entities/Holiday'

const HolidayManagement = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)
  const [currentDate, setCurrentDate] = useState(new Date())

  const [fromDate, toDate] = useMemo(
    () => getDateRange(currentDate),
    [currentDate]
  )
  const [fromDateString] = useMemo(
    () =>
      [fromDate, toDate].map(date => date.toISOString().split('T')[0]) as [
        string,
        string
      ],
    [fromDate, toDate]
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
    queryKey: ['holidays', ServerSITEMAP.holidays.getByMonthStart],
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
              <th>Sun</th>
              <th>Mon</th>
              <th>Tue</th>
              <th>Wed</th>
              <th>Thu</th>
              <th>Fri</th>
              <th>Sat</th>
            </tr>
          </thead>
          <tbody>
            {weekData.map((week, i) => (
              <tr key={i}>
                {week.map((date, index) => {
                  const month =
                    (date < 15 ? toDate.getMonth() : fromDate.getMonth()) + 1
                  const year =
                    month === 1 ? toDate.getFullYear() : fromDate.getFullYear()
                  const targetDateString = `${year}-${month
                    .toString()
                    .padStart(2, '0')}-${date.toString().padStart(2, '0')}`
                  const holiday =
                    date !== -1
                      ? holidays.find(({ date }) => date === targetDateString)
                      : undefined

                  return (
                    <td
                      role='button'
                      key={index}
                      className={holiday ? 'bg-primary text-white' : ''}
                      onClick={() =>
                        holiday
                          ? holidayDelete(targetDateString)
                          : holidayAdd({ date: targetDateString })
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
