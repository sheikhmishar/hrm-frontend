import { useMutation } from '@tanstack/react-query'
import { ChangeEventHandler, useContext, useState } from 'react'

import Input from '../components/Input'
import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import { ToastContext } from '../contexts/toast'
import { capitalizeDelim } from '../libs'
import modifiedFetch from '../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type User from 'backend/Entities/User'
import type { updateUser } from 'backend/controllers/users'
import Button from '../components/Button'
import { AuthContext } from '../contexts/auth'

const UpdatePassword = () => {
  const { self } = useContext(AuthContext)
  const { onErrorDisplayToast, addToast } = useContext(ToastContext)

  const [userCreds, setUserCreds] = useState<Pick<User, 'password'>>({
    password: ''
  })
  const onCredsChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setUserCreds(creds => ({ ...creds, [id]: value }))

  const { isLoading, mutate } = useMutation({
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof updateUser>>(
        ServerSITEMAP.users.put.replace(
          ServerSITEMAP.users._params.id,
          self?.id.toString() || '-1'
        ),
        {
          method: 'put',
          body: JSON.stringify(userCreds)
        }
      ),
    mutationKey: ['updateUser', userCreds],
    onSuccess: data => data?.message && addToast(data.message),
    onError: onErrorDisplayToast,
    retry: false
  })

  return (
    <>
      <div className='text-center'>
        <h3>Update Password</h3>
        <span className='text-danger'>Note:</span> default password is{' '}
        <span className='text-primary'>DEFAULT_PASSWORD</span>{' '}
      </div>

      <hr />

      {(['password'] satisfies KeysOfObjectOfType<User, string>[]).map(k => (
        <Input
          key={k}
          disabled={isLoading}
          id={k}
          label={capitalizeDelim(k)}
          containerClass='my-3'
          placeholder={'Enter ' + capitalizeDelim(k)}
          value={userCreds[k]}
          type='password'
          onChange={onCredsChange}
        />
      ))}
      <div className='mt-4 text-center'>
        <Button
          disabled={isLoading}
          onClick={() => mutate()}
          className='btn-primary'
        >
          <span className='align-items-center d-flex'>
            Update Password
            {isLoading && (
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
    </>
  )
}

export default UpdatePassword
