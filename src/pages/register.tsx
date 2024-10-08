import { useMutation } from '@tanstack/react-query'
import { useContext, useState, type ChangeEventHandler } from 'react'
import { Link, useNavigate } from 'react-router-dom'

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
import { registerUser } from 'backend/controllers/users'
import Employee from 'backend/Entities/Employee'

type Creds = Modify<
  Required<GetReqBodyType<typeof registerUser>>,
  { employee?: Employee }
>

const defaultRegisterCreds: Creds = {
  id: 1,
  email: '',
  name: '',
  password: '',
  phoneNumber: '',
  type: 'HR'
}

const Register: React.FC = () => {
  const { onErrorDisplayToast, addToast } = useContext(ToastContext)
  const { fetchingAuth } = useContext(AuthContext)
  const navigate = useNavigate()

  const [registerCreds, setRegisterCreds] = useState({
    ...defaultRegisterCreds
  })
  const onCredsChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setRegisterCreds(creds => ({ ...creds, [id]: value }))

  const { isLoading, mutate } = useMutation({
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof registerUser>>(
        ServerSITEMAP.users.postRegister,
        { method: 'post', body: JSON.stringify(registerCreds) }
      ),
    mutationKey: ['register', registerCreds],
    onSuccess: data => {
      data?.message && addToast(data.message)
      navigate(ROUTES.login)
    },
    onError: onErrorDisplayToast,
    retry: false
  })

  return (
    <>
      <div className='d-flex justify-content-center mt-5'>
        <div className='mt-5 p-5 rounded-3 shadow-lg'>
          <div>
            <p className='fs-3 fw-bold text-center'>Register</p>
            {(
              [
                'email',
                'name',
                'phoneNumber',
                'password'
              ] satisfies KeysOfObjectOfType<typeof registerCreds, string>[]
            ).map(k => (
              <Input
                key={k}
                disabled={isLoading || fetchingAuth}
                id={k}
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={registerCreds[k]}
                type={k === 'password' ? 'password' : 'text'}
                onChange={onCredsChange}
              />
            ))}

            <div className='mt-4 text-center'>
              <Button
                disabled={isLoading || fetchingAuth}
                onClick={() => mutate()}
                className='btn-primary'
              >
                <span className='align-items-center d-flex'>
                  Register
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
              Already have an account?{' '}
              <Link to={isLoading ? location.pathname : ROUTES.login}>
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer dark />
    </>
  )
}
export default Register
