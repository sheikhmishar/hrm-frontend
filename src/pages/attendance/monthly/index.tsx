import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'

import ServerSITEMAP from '../../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../../contexts/toast'
import modifiedFetch from '../../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import { allEmployeeAttendances } from 'backend/controllers/attendances'

const MonthlyAttendance = () => {
  const { onErrorDisplayToast } = useContext(ToastContext)
  const { data: employeeAttendances, isFetching } = useQuery({
    queryKey: ['employeeAttendances', ServerSITEMAP.attendances.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployeeAttendances>>(
        ServerSITEMAP.attendances.get
      ),
    onError: onErrorDisplayToast
  })
  return <>
  
  </>
}

export default MonthlyAttendance
