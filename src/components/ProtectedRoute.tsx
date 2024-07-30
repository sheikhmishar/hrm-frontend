import React, {
  type PropsWithChildren,
  useContext,
  useLayoutEffect
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { LOGIN_ROUTE_QUERY, ROUTES } from '../constants/CONSTANTS'
import { AuthContext } from '../contexts/auth'

type Props = {
  authenticatedOnly?: boolean
  unAuthenticatedOnly?: boolean
} & PropsWithChildren

const ProtectedRoute: React.FC<Props> = props => {
  const { authenticatedOnly, unAuthenticatedOnly, children } = props

  const navigate = useNavigate()
  const location = useLocation()
  const { self, token } = useContext(AuthContext)

  useLayoutEffect(() => {
    if (authenticatedOnly && location.pathname !== ROUTES.login) {
      if (!self)
        navigate(
          `${ROUTES.login}?${LOGIN_ROUTE_QUERY.prev}=` +
            encodeURIComponent(location.pathname + location.search)
        )
      else if (!token) navigate(ROUTES.login)
    } else if (
      unAuthenticatedOnly &&
      self &&
      location.pathname !== ROUTES.dashboard
    )
      navigate(ROUTES.dashboard)
  }, [
    authenticatedOnly,
    navigate,
    location.pathname,
    location.search,
    self,
    token,
    unAuthenticatedOnly
  ])

  return <>{children}</>
}

export default ProtectedRoute
