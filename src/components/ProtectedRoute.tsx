import React, {
  useContext,
  useLayoutEffect,
  useMemo,
  type PropsWithChildren
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { LOGIN_ROUTE_QUERY, ROUTES } from '../constants/CONSTANTS'
import { AuthContext } from '../contexts/auth'
import { SettingContext } from '../contexts/setting'

import type User from 'backend/Entities/User'

type Props = {
  authenticatedOnly?: boolean
  unAuthenticatedOnly?: boolean
  rolesAllowed?: readonly (typeof User.TYPES)[number][]
} & PropsWithChildren

const ProtectedRoute: React.FC<Props> = props => {
  const { authenticatedOnly, unAuthenticatedOnly, rolesAllowed, children } =
    props

  const navigate = useNavigate()
  const location = useLocation()
  const { self, token, fetchingAuth } = useContext(AuthContext)
  const { fetchingSettings, settings } = useContext(SettingContext)
  const { prev: prevURL } = useMemo(
    () =>
      Object.fromEntries(new URLSearchParams(location.search)) as {
        prev?: string
      },
    [location.search]
  )

  useLayoutEffect(() => {
    if (fetchingAuth || fetchingSettings) return

    if (authenticatedOnly || rolesAllowed) {
      if (!self || !settings.length) {
        if (location.pathname !== ROUTES.login)
          navigate(
            `${ROUTES.login}?${LOGIN_ROUTE_QUERY.prev}=` +
              encodeURIComponent(location.pathname + location.search)
          )
      } else if (!token) {
        if (location.pathname !== ROUTES.login) navigate(ROUTES.login)
      } else if (self.status === 'inactive') {
        if (location.pathname !== ROUTES.awaitingApproval)
          navigate(ROUTES.awaitingApproval)
      } else if (location.pathname === ROUTES.awaitingApproval)
        navigate(ROUTES.dashboard)
      else if (rolesAllowed && !rolesAllowed.includes(self.type))
        navigate(ROUTES.employee.list)
    } else if (
      unAuthenticatedOnly &&
      self &&
      !fetchingSettings &&
      settings.length
    ) {
      if (prevURL && location.pathname !== prevURL) navigate(prevURL)
      else if (location.pathname !== ROUTES.employee.list)
        navigate(ROUTES.employee.list)
    }
  }, [
    fetchingAuth,
    fetchingSettings,
    settings.length,
    rolesAllowed,
    authenticatedOnly,
    navigate,
    location.pathname,
    location.search,
    prevURL,
    self,
    token,
    unAuthenticatedOnly
  ])

  if (fetchingAuth || fetchingSettings)
    // FIXME:   breaks login
    return (
      <div className='bottom-0 overflow-auto position-absolute pt-4 start-50 toast-container top-0 translate-middle-x vh-100'>
        <div
          className='align-items-center border-0 fade mb-2 show text-bg-info toast'
          role='alert'
        >
          <div className='d-flex'>
            <div className='toast-body'>
              {fetchingAuth
                ? 'Signing In...'
                : fetchingSettings
                ? 'Fetching preferences'
                : ''}
            </div>
          </div>
        </div>
      </div>
    )
  return <>{children}</>
}

export default ProtectedRoute
