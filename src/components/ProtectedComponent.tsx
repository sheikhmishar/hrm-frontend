import React, { PropsWithChildren, useContext } from 'react'

import { AuthContext } from '../contexts/auth'

import User from 'backend/Entities/User'

type Props = {
  authenticatedOnly?: boolean
  unAuthenticatedOnly?: boolean
  rolesAllowed?: readonly (typeof User.TYPES)[number][]
} & PropsWithChildren

const ProtectedComponent: React.FC<Props> = props => {
  const { authenticatedOnly, unAuthenticatedOnly, rolesAllowed, children } =
    props

  const { self, token } = useContext(AuthContext)

  if (authenticatedOnly || rolesAllowed) {
    if (
      !(self?.status === 'active' && token) ||
      (rolesAllowed && !rolesAllowed.includes(self.type))
    )
      return <></>
  }
  if (unAuthenticatedOnly && self) return <></>
  return <>{children}</>
}

export default ProtectedComponent
