import { useQuery } from '@tanstack/react-query'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren
} from 'react'

import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import useLocalStorage from '../hooks/useLocalStorage'
import modifiedFetch, { tokenRef } from '../libs/modifiedFetch'
import { ToastContext } from './toast'

import { GetResponseType } from 'backend/@types/response'
import type { selfDetails } from 'backend/controllers/users'

const defaultSelfDetails: GetResponseType<typeof selfDetails> = {
  id: -1,
  email: '',
  iat: 1,
  name: '',
  type: 'HR'
}

type AuthContext = {
  token: string | null
  setToken: (token: string | null) => void
  self?: typeof defaultSelfDetails
  setSelf: (self: typeof defaultSelfDetails) => void
  fetchingAuth: boolean
}

export const AuthContext = createContext<AuthContext>({
  token: '',
  setToken() {},
  setSelf() {},
  fetchingAuth: false
})

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const { value: token, setValue: setToken } = useLocalStorage('token')

  const { addToast, onErrorDisplayToast } = useContext(ToastContext)
  const [self, setSelf] = useState<typeof defaultSelfDetails>()

  // TODO: usePreviousUnchanged
  // TODO: refreshToken
  useEffect(() => {
    if (tokenRef.current === token) return
    tokenRef.current = token
    if (!token) return setSelf(undefined)
  }, [token, tokenRef, setSelf])

  const { isFetching: fetchingAuth } = useQuery({
    enabled: tokenRef.current !== token && !!token,
    queryKey: ['getSelf', ServerSITEMAP.users.getSelf, tokenRef.current, token],
    queryFn: () =>
      modifiedFetch<typeof defaultSelfDetails>(ServerSITEMAP.users.getSelf),
    onError: (err: { message: string }) => {
      onErrorDisplayToast(err)
      addToast(`Error While Logging In: ${err.message || ''}`, 'ERROR')
    },
    onSuccess: selfDetailsRes => {
      if (!selfDetailsRes) return
      addToast('Login Successful')
      setSelf(selfDetailsRes)
    }
  })

  const value = useMemo(
    () => ({ token, setToken, self, setSelf, fetchingAuth }),
    [fetchingAuth, self, setToken, setSelf, token]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
