import { useMutation, useQuery } from '@tanstack/react-query'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { FaUser, FaPause, FaPlay } from 'react-icons/fa6'

import { ROUTES } from '../constants/CONSTANTS'
import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import { AuthContext } from '../contexts/auth'
import { ToastContext } from '../contexts/toast'
import modifiedFetch from '../libs/modifiedFetch'
import Button from './Button'
import NavDropdownButton from './NavbarDropdownButton'
import Offcanvas from './Offcanvas'
import ProtectedComponent from './ProtectedComponent'
import SidebarItems from './SidebarItems'

import type { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import type {
  addBreak,
  addResume,
  employeeCurrentStatus
} from 'backend/controllers/attendances'
import { dateToString } from '../libs'

const Navbar: React.FC = () => {
  const location = useLocation()

  const { onErrorDisplayToast, addToast } = useContext(ToastContext)
  const { setToken, self, setSelf } = useContext(AuthContext)

  const [sidebar, setSidebar] = useState(false)
  const collapseSidebar = () => setSidebar(false)
  const expandSidebar = () => setSidebar(true)

  useEffect(collapseSidebar, [location.pathname])

  const {
    data: currentStatus,
    isFetching: fetchingCurrentStatus,
    refetch
  } = useQuery({
    queryKey: [
      'employeeCurrentStatus',
      ServerSITEMAP.attendances.getCurrentStatus
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof employeeCurrentStatus>>(
        ServerSITEMAP.attendances.getCurrentStatus
      ),
    onError: onErrorDisplayToast
  })

  useEffect(() => {
    const interval = setInterval(self?.employeeId ? refetch : () => {}, 3000)

    return () => clearInterval(interval)
  }, [refetch, self])

  const { isLoading: loadingPause, mutate: pause } = useMutation({
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof addBreak>>(
        ServerSITEMAP.attendances.postPause,
        {
          method: 'post',
          body: JSON.stringify({
            date: dateToString(new Date()),
            time: new Date().toTimeString().slice(0, 8)
          } satisfies GetReqBodyType<typeof addBreak>)
        }
      ),
    mutationKey: ['addBreak', currentStatus?.message],
    onSuccess: data => data?.message && addToast(data.message),
    onError: onErrorDisplayToast,
    retry: false
  })
  const { isLoading: loadingResume, mutate: resume } = useMutation({
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof addResume>>(
        ServerSITEMAP.attendances.postResume,
        {
          method: 'post',
          body: JSON.stringify({
            date: dateToString(new Date()),
            time: new Date().toTimeString().slice(0, 8)
          } satisfies GetReqBodyType<typeof addResume>)
        }
      ),
    mutationKey: ['addResume', currentStatus?.message],
    onSuccess: data => data?.message && addToast(data.message),
    onError: onErrorDisplayToast,
    retry: false
  })

  return (
    <>
      <nav className='align-items-center bg-body d-flex navbar px-3 py-2 shadow-sm z-3'>
        <div className='container-fluid'>
          <button
            className='border-0 d-md-none navbar-toggler ps-0'
            aria-controls='offcanvasNavbar'
            onClick={expandSidebar}
          >
            <span className='navbar-toggler-icon' />
          </button>
          <h5 className='mb-0 text-muted'>
            <strong>HR Management</strong>
          </h5>
          <ProtectedComponent rolesAllowed={['Employee']}>
            <Button
              onClick={() =>
                currentStatus?.message === 'BREAK' ? resume() : pause()
              }
              disabled={fetchingCurrentStatus || loadingPause || loadingResume}
              className='btn-primary ms-2'
            >
              {currentStatus?.message === 'PRESENT' ? <FaPause /> : <FaPlay />}
            </Button>
          </ProtectedComponent>
          <div className='align-items-center d-flex ms-auto'>
            <NavDropdownButton
              label='Profile'
              sublabel={self?.name || 'Unknown'}
              className='ms-2 pe-0'
              icon={<FaUser />}
            >
              <NavDropdownButton.NavDropdownItem to={ROUTES.password}>
                Update Password
              </NavDropdownButton.NavDropdownItem>
              <ProtectedComponent rolesAllowed={['SuperAdmin']}>
                <NavDropdownButton.NavDropdownItem to={ROUTES.user}>
                  Users
                </NavDropdownButton.NavDropdownItem>
              </ProtectedComponent>
              <li
                role='button'
                onClick={() => {
                  setToken(null)
                  setSelf(undefined)
                }}
              >
                <div className='dropdown-item'>Logout</div>
              </li>
            </NavDropdownButton>
          </div>
        </div>
      </nav>

      <Offcanvas
        directionClass='offcanvas-start'
        onClose={collapseSidebar}
        show={sidebar}
      >
        <SidebarItems />
      </Offcanvas>
    </>
  )
}

export default Navbar
