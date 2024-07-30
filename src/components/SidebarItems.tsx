import React, { useState } from 'react'
import type { NavLinkProps } from 'react-router-dom'
import { NavLink, useLocation } from 'react-router-dom'

import { BsPersonVideo2 } from 'react-icons/bs'
import {
  FaMapLocationDot,
  FaMoneyBills,
  FaBusinessTime,
  FaBuildingNgo
} from 'react-icons/fa6'
import { LuBuilding2 } from 'react-icons/lu'
import { VscOrganization } from 'react-icons/vsc'

import { ROUTES } from '../constants/CONSTANTS'
import AccordionItem from './Accordion'
import Footer from './Footer'

const BASE_NAVLINK_CLASSES =
  'nav-link p-3 rounded text-hover-opacity-100 text-light text-opacity-75'
const NavItem: React.FC<NavLinkProps> = ({ children, ...props }) => (
  <li className='nav-item'>
    <NavLink
      {...props}
      className={({ isActive }) =>
        isActive
          ? BASE_NAVLINK_CLASSES + ' bg-primary active'
          : BASE_NAVLINK_CLASSES
      }
    >
      {children}
    </NavLink>
  </li>
)

const CompanyLogo: React.FC<{ src: string }> = ({ src }) => {
  const [imageStatus, setImageStatus] = useState<
    'LOADING' | 'SUCCESS' | 'ERROR'
  >('LOADING')

  return (
    <>
      <div
        style={{ height: 80, width: 80 }}
        className={
          imageStatus === 'SUCCESS'
            ? 'd-none'
            : imageStatus === 'ERROR'
            ? 'bg-primary-dark d-inline-block rounded'
            : 'd-inline-block placeholder-glow placeholder-wave rounded'
        }
      >
        <div className='h-100 placeholder rounded w-100' />
      </div>
      <img
        src={src}
        className={
          imageStatus === 'SUCCESS'
            ? 'bg-light bg-opacity-10 object-fit-contain rounded'
            : 'd-none'
        }
        height={80}
        width={80}
        alt='skylane logo'
        onLoad={() => setImageStatus('SUCCESS')}
        onError={() => setImageStatus('ERROR')}
      />
    </>
  )
}

const SidebarItems: React.FC = () => {
  const location = useLocation()

  return (
    <>
      <NavLink to={ROUTES.root} className='mb-3 navbar-brand text-center'>
        <CompanyLogo src='/favicon.png' />
      </NavLink>

      <NavItem to={ROUTES.dashboard}>Dashboard</NavItem>

      <div className='accordion mt-1'>
        <AccordionItem
          active={location.pathname.startsWith(ROUTES.organization._)}
          className='pe-0'
          content={
            <>
              <FaBuildingNgo />{' '}Organization
            </>
          }
        >
          <NavItem to={ROUTES.organization.branch}>
            <FaMapLocationDot color='98B4BF' /> Branch
          </NavItem>
          <NavItem to={ROUTES.organization.company}>
            <VscOrganization color='98B4BF' size={18} /> Company
          </NavItem>
          <NavItem to={ROUTES.organization.department}>
            <LuBuilding2 color='98B4BF' size={18} /> Department
          </NavItem>
          <NavItem to={ROUTES.organization.designation}>
            <BsPersonVideo2 color='98B4BF' size={18} /> Designation
          </NavItem>
          <NavItem to={ROUTES.organization.dutyType}>
            <FaBusinessTime color='98B4BF' size={18} />
            Duty Type
          </NavItem>
          <NavItem to={ROUTES.organization.salaryType}>
            <FaMoneyBills color='98B4BF' size={18} /> Salary Type
          </NavItem>
        </AccordionItem>
      </div>

      <Footer />
    </>
  )
}

export default SidebarItems
