import { useMutation, useQuery } from '@tanstack/react-query'
import {
  useCallback,
  useContext,
  useState,
  type ChangeEventHandler
} from 'react'
import { FaPen } from 'react-icons/fa6'

import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import Select, { type DropDownEventHandler } from '../components/Select'
import Table from '../components/Table'
import { defaultUser } from '../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import { ToastContext } from '../contexts/toast'
import { capitalize, capitalizeDelim } from '../libs'
import modifiedFetch from '../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type User from 'backend/Entities/User'
import type {
  allUsers,
  updateUser,
  userDetails
} from 'backend/controllers/users'
import { BLANK_ARRAY } from '../constants/CONSTANTS'
import { AuthContext } from '../contexts/auth'

const visibleKeys = (Object.keys(defaultUser) as (keyof User)[]).filter(
  k => k !== 'id' && k !== 'employee' && k !== 'password'
) as (keyof OmitKey<User, 'id' | 'employee' | 'password'>)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const UserPage = () => {
  const { self } = useContext(AuthContext)
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [user, setUser] = useState<User>({ ...defaultUser })
  const onUserChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setUser(user => ({ ...user, [id]: value }))

  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { id, value } }) => setUser(user => ({ ...user, [id]: value })),
    []
  )

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setUser(user => ({ ...user, _id: -1 }))
      return !sidebar
    })

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const {
    refetch: refetchUsers,
    data: _users = BLANK_ARRAY,
    isFetching
  } = useQuery({
    queryKey: ['users', ServerSITEMAP.users.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allUsers>>(ServerSITEMAP.users.get),
    onError: onErrorDisplayToast
  })

  const { isFetching: userLoading } = useQuery({
    queryKey: ['user', ServerSITEMAP.users.getById, user.id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof userDetails>>(
        ServerSITEMAP.users.getById.replace(
          ServerSITEMAP.users._params.id,
          user.id.toString()
        )
      ),
    enabled: user.id > 0,
    onError: onErrorDisplayToast,
    onSuccess: user => user && setUser(user)
  })

  const { mutate: userUpdate, isLoading: userUpdateLoading } = useMutation({
    mutationKey: ['userUpdate', ServerSITEMAP.users.put, user],
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof updateUser>>(
        ServerSITEMAP.users.put.replace(
          ServerSITEMAP.users._params.id,
          user.id.toString()
        ),
        { method: 'put', body: JSON.stringify(user) }
      ),
    onError: onErrorDisplayToast,
    onSuccess: data => {
      data?.message && addToast(data.message)
      toggleSidebar()
      refetchUsers()
    }
  })

  const users = _users.filter(
    ({ id, type }) => id !== self?.id && type !== 'Employee'
  )

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>User</strong>
            </h4>
            <span className='text-primary'>Details</span>
          </div>
          {isFetching && (
            <div className='ms-3 spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          )}
          <div className='ms-auto w-25'>
            <input
              className='form-control py-2 rounded-3'
              id='search'
              placeholder='Search here'
              onChange={onSearchInputChange}
              value={search}
            />
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        rows={users
          .filter(user =>
            visibleKeys.find(key =>
              user[key].toString().toLowerCase().includes(search.toLowerCase())
            )
          )
          .map(user =>
            visibleKeys
              .map(key => (
                <>
                  {user[key].substring(0, 50) +
                    (user[key].length > 50 ? '...' : '')}
                </>
              ))
              .concat(
                <Button
                  className='border-0 link-primary text-body'
                  onClick={() => {
                    setUser(d => ({ ...d, id: user.id }))
                    toggleSidebar()
                  }}
                >
                  <FaPen />
                </Button>
              )
          )}
      />

      <Modal isOpen={sidebar} setIsOpen={setSidebar}>
        <Modal.Header title='Update User' close={toggleSidebar} />
        <Modal.Body>
          {(['phoneNumber'] satisfies KeysOfObjectOfType<User, string>[]).map(
            k => (
              <Input
                key={k}
                disabled={userLoading}
                id={k}
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={user[k]}
                onChange={onUserChange}
              />
            )
          )}
          {(['type'] satisfies KeysOfObjectOfType<User, string>[]).map(k => (
            <Select
              key={k}
              id={k}
              disabled={userLoading}
              autoComplete='true'
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={user[k]}
              options={(['HR', 'SuperAdmin'] satisfies User['type'][]).map(
                name => ({ value: name, label: name })
              )}
              onChange={onSelectChange}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={userLoading || userUpdateLoading}
              className='btn-primary mx-2'
              onClick={() => userUpdate()}
            >
              <span className='align-items-center d-flex'>
                Update
                {(userLoading || userUpdateLoading) && (
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
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default UserPage
