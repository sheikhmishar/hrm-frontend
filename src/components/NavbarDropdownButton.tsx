import React, { useEffect, useState } from 'react'
import type { NavLinkProps } from 'react-router-dom'
import { NavLink, useLocation } from 'react-router-dom'

type Props = { label: string; sublabel: string; icon: JSX.Element }
const NavDropdownButton: React.FC<JSX.IntrinsicElements['li'] & Props> = p => {
  const { children, label, sublabel, className, icon, ...props } = p

  const [dropdown, setDropdown] = useState(false)
  const toggleDropdown = () => setDropdown(dropdown => !dropdown)

  const location = useLocation()
  useEffect(() => setDropdown(false), [location.pathname])

  return (
    <li className='dropdown list-unstyled' {...props}>
      <button
        onClick={toggleDropdown}
        className={`btn ${className || ''}`}
        aria-expanded={dropdown}
      >
        <span className='align-items-center d-flex justify-content-center'>
          <div className='me-3 text-start'>
            <strong className='text-muted'>{label}</strong>
            <br />
            <span className='text-muted'>{sublabel}</span>
          </div>
          <i className='border mb-0 p-2 rounded-circle'>{icon}</i>
        </span>
      </button>
      <ul
        className={`border-0 dropdown-menu end-0 shadow-sm ${
          dropdown ? 'show' : ''
        }`}
      >
        {children}
      </ul>
    </li>
  )
}

const NavDropdownItem: React.FC<NavLinkProps> = ({ children, ...props }) => (
  <li>
    <NavLink {...props} className='dropdown-item'>
      {children}
    </NavLink>
  </li>
)

const NavbarDropdownButton = Object.assign(NavDropdownButton, { NavDropdownItem })

export default NavbarDropdownButton
