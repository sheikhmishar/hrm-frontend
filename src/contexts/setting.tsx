import { useQuery } from '@tanstack/react-query'
import {
  createContext,
  useContext,
  useMemo,
  type FC,
  type PropsWithChildren
} from 'react'

import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import modifiedFetch from '../libs/modifiedFetch'
import { ToastContext } from './toast'
import { AuthContext } from './auth'
import { BLANK_ARRAY } from '../constants/CONSTANTS'

import type { GetResponseType } from 'backend/@types/response'
import type { allSettings } from 'backend/controllers/settings'
import { SETTING_KEYS } from '../libs'
import { SETTINGS } from '../libs'

type SettingContext = {
  fetchingSettings: boolean
  settings: NonNullable<GetResponseType<typeof allSettings>>
  refetchSettings: () => void
}

export const SettingContext = createContext<SettingContext>({
  fetchingSettings: false,
  settings: [],
  refetchSettings() {}
})

const SettingProvider: FC<PropsWithChildren> = ({ children }) => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)
  const { token } = useContext(AuthContext)

  const {
    data: settings = BLANK_ARRAY,
    isFetching: fetchingSettings,
    refetch: refetchSettings
  } = useQuery({
    enabled: !!token,
    queryKey: ['settings', ServerSITEMAP.settings.get, token],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allSettings>>(
        ServerSITEMAP.settings.get
      ),
    onError: (err: { message: string }) => {
      onErrorDisplayToast(err)
      addToast(`Error While Fetching Settings: ${err.message || ''}`, 'ERROR')
    },
    onSuccess: data => {
      if (data) {
        addToast('Settings Fetched')
        SETTINGS.PAYROLL_CYCLE_START_DATE =
          parseInt(
            data.find(
              ({ property }) =>
                property === SETTING_KEYS.PAYROLL_CYCLE_START_DATE
            )?.value || ''
          ) || 1
      }
    }
  })

  const value = useMemo(
    () => ({ token, fetchingSettings, refetchSettings, settings }),
    [token, fetchingSettings, refetchSettings, settings]
  )

  return (
    <SettingContext.Provider value={value}>{children}</SettingContext.Provider>
  )
}

export default SettingProvider
