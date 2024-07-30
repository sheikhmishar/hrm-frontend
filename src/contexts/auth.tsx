import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type PropsWithChildren
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import useLocalStorage from '../hooks/useLocalStorage'
import { ToastContext } from './toast'
import { tokenRef as globalTokenRef } from '../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import type { selfDetails } from 'backend/controllers/users'

const defaultSelfDetails: GetResponseType<typeof selfDetails> = {
  id: -1,
  email: '',
  iat: 1,
  name: '',
  type: 'admin'
}

type AuthContext = {
  token: string | null
  setToken: (token: string | null) => void
  self?: typeof defaultSelfDetails
  fetchingAuth: boolean
}

export const AuthContext = createContext<AuthContext>({
  token: '',
  setToken() {},
  fetchingAuth: false
})

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const { value: token, setValue: setToken } = useLocalStorage('token')
  const navigate = useNavigate()
  const location = useLocation()
  const { prev: prevURL } = useMemo(
    () =>
      Object.fromEntries(new URLSearchParams(location.search)) as {
        prev?: string
      },
    [location.search]
  )

  const { addToast } = useContext(ToastContext)
  const [self, setSelf] = useState<typeof defaultSelfDetails>()
  const [fetchingAuth, setFetchingAuth] = useState(false)
  const tokenRef = useRef<string | null>(null)

  useEffect(() => {
    //   TODO: usePreviousUnchanged
    if (tokenRef.current !== token) {
      tokenRef.current = token
      globalTokenRef.current = token

      if (!token) return setSelf(undefined)
      ;(async () => {
        try {
          setFetchingAuth(true)
          const res = await fetch(
            (import.meta.env.REACT_APP_BASE_URL || 'http://localhost:5000') +
              ServerSITEMAP.users.getSelf,
            { headers: { authorization: `Bearer ${token}` } }
          )
          setFetchingAuth(false)

          const selfDetailsRes:
            | typeof defaultSelfDetails & { message?: string } =
            await res.json()
          if (res.ok && selfDetailsRes) {
            addToast('Login Successful')
            return setSelf(selfDetailsRes)
          }

          setToken(null)
          addToast('Login Failed. Please re-login', 'ERROR')
          throw selfDetailsRes
        } catch (err) {
          setFetchingAuth(false)
          addToast(
            `Error While Logging In: ${
              (err as { message?: string }).message || ''
            }`,
            'ERROR'
          )
        }
      })()
    }
    // TODO: omit ref by optimizing context as setState should be refEq
    // TODO: refreshToken
  }, [addToast, setToken, token])

  useEffect(() => {
    if (prevURL && self && location.pathname !== prevURL) navigate(prevURL)
  }, [navigate, location.pathname, prevURL, self])

  const value = useMemo(
    () => ({ token, setToken, self, fetchingAuth }),
    [fetchingAuth, self, setToken, token]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
