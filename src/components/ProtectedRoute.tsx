import React, {
  useContext,
  useLayoutEffect,
  type PropsWithChildren
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { LOGIN_ROUTE_QUERY, ROUTES } from '../constants/CONSTANTS'
import { AuthContext } from '../contexts/auth'

import User from 'backend/Entities/User'

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
  const { self, token } = useContext(AuthContext)

  useLayoutEffect(() => {
    if (authenticatedOnly || rolesAllowed) {
      if (!self) {
        if (location.pathname !== ROUTES.login)
          navigate(
            `${ROUTES.login}?${LOGIN_ROUTE_QUERY.prev}=` +
              encodeURIComponent(location.pathname + location.search)
          )
      } else if (!token) {
        if (location.pathname !== ROUTES.login) navigate(ROUTES.login)
      } else if (rolesAllowed && !rolesAllowed.includes(self.type))
        navigate(ROUTES.employee.list)
    } else if (
      unAuthenticatedOnly &&
      self &&
      location.pathname !== ROUTES.employee.list
    )
      navigate(ROUTES.employee.list)
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
