import { useQuery } from '@tanstack/react-query'
import { useContext, useEffect, useMemo, useState } from 'react'

import Button from '../../components/Button'
import CalenderSlider from '../../components/CalenderSlider'
import Table from '../../components/Table'
import { BLANK_ARRAY } from '../../constants/CONSTANTS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import {
  dateToString,
  downloadStringAsFile,
  getDateRange,
  stringToDate
} from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import { allCompaniesMonthlySalaries } from 'backend/controllers/monthly-salaries'

const MonthlyCost = () => {
  const { onErrorDisplayToast } = useContext(ToastContext)

  const [currentDate, setCurrentDate] = useState(new Date())

  const [fromDate] = useMemo(() => getDateRange(currentDate), [currentDate])
  const [fromDateString] = useMemo(
    () => [fromDate].map(dateToString) as [string],
    [fromDate]
  )

  useEffect(
    () => setCurrentDate(stringToDate(fromDateString)),
    [fromDateString]
  )

  const { data = BLANK_ARRAY, isFetching } = useQuery({
    queryKey: [
      'companyWiseSalaries',
      ServerSITEMAP.monthlySalaries.getAllCompanySalaries,
      fromDateString
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allCompaniesMonthlySalaries>>(
        ServerSITEMAP.monthlySalaries.getAllCompanySalaries +
          '?' +
          new URLSearchParams({
            monthStartDate: fromDateString
          } satisfies typeof ServerSITEMAP.monthlySalaries._queries)
      ),
    onError: onErrorDisplayToast
  })

  return (
    <>
      <div className='align-items-center d-flex flex-wrap gap-2 justify-content-between mb-3'>
        <CalenderSlider
          monthly
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
        />
        <Button
          onClick={() =>
            downloadStringAsFile(
              'getCsvFromSalaries(companyWiseSalaries)',
              'employeeSalaries.csv',
              { type: 'text/csv' }
            )
          }
          className='btn-primary'
        >
          Export CSV
        </Button>

        {isFetching && (
          <div
            className='me-auto ms-3 spinner-border text-primary'
            role='status'
          >
            <span className='visually-hidden'>Loading...</span>
          </div>
        )}
      </div>

      <Table
        columns={['Company', 'Salary Cost']}
        rows={data.map(({ name, salaries }) => [
          <>{name}</>,
          <>
            {salaries.reduce(
              (total, { totalSalary }) => total + totalSalary,
              0
            )}
          </>
        ])}
      />
    </>
  )
}

export default MonthlyCost
