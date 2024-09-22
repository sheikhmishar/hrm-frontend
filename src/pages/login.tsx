import { useMutation } from '@tanstack/react-query'
import { useContext, useState, type ChangeEventHandler } from 'react'
import { Link } from 'react-router-dom'

import Button from '../components/Button'
import Input from '../components/Input'
import Footer from '../components/Footer'
import { ROUTES } from '../constants/CONSTANTS'
import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import { AuthContext } from '../contexts/auth'
import { ToastContext } from '../contexts/toast'
import { capitalizeDelim } from '../libs'
import modifiedFetch from '../libs/modifiedFetch'

import { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import { loginUser } from 'backend/controllers/users'

type Creds = Required<GetReqBodyType<typeof loginUser>>

const defaultLoginCreds: Creds = { inputData: '', password: '' }

const Login: React.FC = () => {
  const { onErrorDisplayToast } = useContext(ToastContext)
  const { setToken, fetchingAuth } = useContext(AuthContext)

  const [loginCreds, setLoginCreds] = useState({ ...defaultLoginCreds })
  const onCredsChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setLoginCreds(creds => ({ ...creds, [id]: value }))

  const { isLoading, mutate } = useMutation({
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof loginUser>>(
        ServerSITEMAP.users.postLogin,
        { method: 'post', body: JSON.stringify(loginCreds) }
      ),
    mutationKey: ['login', loginCreds],
    onSuccess: data => data?.token && setToken(data.token),
    onError: onErrorDisplayToast,
    retry: false
  })

  return (
    <>
      <div className='d-flex justify-content-center py-5'>
        <div className='mt-5 p-5 rounded-3 shadow-lg'>
          <div>
            <p className='fs-3 fw-bold text-center'>Login</p>
            {(
              ['inputData', 'password'] satisfies KeysOfObjectOfType<
                typeof loginCreds,
                string
              >[]
            ).map(k => (
              <Input
                key={k}
                disabled={isLoading || fetchingAuth}
                id={k}
                // TODO: capitalizeDelim for camelCase
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={loginCreds[k]}
                type={k === 'password' ? 'password' : 'text'}
                onChange={onCredsChange}
              />
            ))}
            {/* TODO: <BsFillEyeFill /> : <BsFillEyeSlashFill />} */}

            {/* <Link
            to={isLoading ? location.pathname : ROUTES.forgotPasswordEmail}
            className='d-block mt-1 text-decoration-none text-success'
          >
            Forgot password ?
          </Link> */}

            <div className='mt-4 text-center'>
              <Button
                disabled={isLoading || fetchingAuth}
                onClick={() => mutate()}
                className='btn-primary'
              >
                <span className='align-items-center d-flex'>
                  Login
                  {(isLoading || fetchingAuth) && (
                    <div
                      className='ms-2 spinner-border spinner-border-sm text-light'
                      role='status'
                    >
                      <span className='visually-hidden'>Loading...</span>
                    </div>
                  )}
                </span>
              </Button>
            </div>

            <div className='mt-4 text-center text-muted'>
              Don't have an account?{' '}
              <Link to={isLoading ? location.pathname : ROUTES.register}>
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer dark />
    </>
  )
}
export default Login
