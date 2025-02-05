import React, { useState } from 'react'
import type { NavLinkProps } from 'react-router-dom'
import { NavLink, useLocation } from 'react-router-dom'

import { BsPersonVideo2 } from 'react-icons/bs'
import {
  FaBorderAll,
  FaBuildingNgo,
  FaBusinessTime,
  FaCalendar,
  FaChartGantt,
  FaMapLocationDot,
  FaMoneyBills,
  FaUserGroup,
  FaUsers,
  FaWrench
} from 'react-icons/fa6'
import { LuBuilding2 } from 'react-icons/lu'
import { VscOrganization } from 'react-icons/vsc'

import { ROUTES } from '../constants/CONSTANTS'
import AccordionItem from './Accordion'
import Footer from './Footer'
import ProtectedComponent from './ProtectedComponent'

const BASE_NAVLINK_CLASSES =
  'nav-link px-3 py-2 rounded-3 my-1 text-hover-opacity-100 text-light text-opacity-75'
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
        style={{ height: 100, width: 100 }}
        className={
          imageStatus === 'SUCCESS'
            ? 'd-none'
            : imageStatus === 'ERROR'
            ? 'bg-primary-dark d-inline-block rounded-3'
            : 'd-inline-block placeholder-glow placeholder-wave rounded-3'
        }
      >
        <div className='h-100 placeholder rounded-3 w-100' />
      </div>
      <img
        src={src}
        className={
          imageStatus === 'SUCCESS'
            ? 'bg-light bg-opacity-10 object-fit-contain rounded-3'
            : 'd-none'
        }
        height={100}
        width={100}
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

      <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
        <NavItem to={ROUTES.dashboard}>
          <FaBorderAll className='me-2' /> Dashboard
        </NavItem>
      </ProtectedComponent>

      <div className='accordion mt-1'>
        <AccordionItem
          active={location.pathname.startsWith(ROUTES.employee._)}
          className='pe-0'
          contentJSX={
            <>
              <FaUserGroup className='me-2' />
              &nbsp;Employee
            </>
          }
        >
          <NavItem to={ROUTES.employee.list}>
            <FaUsers className='me-2' /> Employee List
          </NavItem>
          <NavItem to={ROUTES.employee.assets}>
            <FaUsers className='me-2' /> Allocated Assets
          </NavItem>
          <NavItem to={ROUTES.employee.notices}>
            <FaUsers className='me-2' /> Last Working Day
          </NavItem>
        </AccordionItem>
      </div>
      <div className='accordion mt-1'>
        <AccordionItem
          active={location.pathname.startsWith(ROUTES.leave._)}
          className='pe-0'
          contentJSX={
            <>
              <FaUserGroup className='me-2' />
              &nbsp;Leave
            </>
          }
        >
          <NavItem to={ROUTES.leave.assigned}>
            <FaUsers className='me-2' /> Leave Assigned
          </NavItem>
          <NavItem to={ROUTES.leave.calender}>
            <FaCalendar className='me-2' /> Calender
          </NavItem>
        </AccordionItem>
      </div>
      <div className='accordion mt-1'>
        <AccordionItem
          active={location.pathname.startsWith(ROUTES.attendance._)}
          className='pe-0'
          contentJSX={
            <>
              <FaUserGroup className='me-2' />
              &nbsp;Attendance
            </>
          }
        >
          <NavItem to={ROUTES.attendance.monthly}>
            <FaUsers className='me-2' /> Monthly Attendance
          </NavItem>
          <NavItem to={ROUTES.attendance.history}>
            <FaUsers className='me-2' /> Check In/Out History
          </NavItem>
          <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
            <NavItem to={ROUTES.attendance.import}>
              <FaUsers className='me-2' /> Import
            </NavItem>
          </ProtectedComponent>
          <NavItem to={ROUTES.attendance.holiday}>
            <FaUsers className='me-2' /> Offdays
          </NavItem>
        </AccordionItem>
      </div>
      <div className='accordion mt-1'>
        <AccordionItem
          active={location.pathname.startsWith(ROUTES.payroll._)}
          className='pe-0'
          contentJSX={
            <>
              <FaUserGroup className='me-2' />
              &nbsp;Payroll
            </>
          }
        >
          <NavItem to={ROUTES.payroll.monthly}>
            <FaUsers className='me-2' /> Monthly payroll
          </NavItem>
          <NavItem to={ROUTES.payroll.loan}>
            <FaUsers className='me-2' /> Loan
          </NavItem>
          <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
            <NavItem to={ROUTES.payroll.update}>
              <FaUsers className='me-2' /> Salary Update
            </NavItem>
            <NavItem to={ROUTES.payroll.cost}>
              <FaUsers className='me-2' /> Salary Cost
            </NavItem>
          </ProtectedComponent>
        </AccordionItem>
      </div>

      <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
        <div className='accordion mt-1'>
          <AccordionItem
            active={location.pathname.startsWith(ROUTES.organization._)}
            className='pe-0'
            contentJSX={
              <>
                <FaBuildingNgo className='me-2' />
                &nbsp;Organization
              </>
            }
          >
            <NavItem to={ROUTES.organization.branch}>
              <FaMapLocationDot className='me-2' /> Branch
            </NavItem>
            <NavItem to={ROUTES.organization.company}>
              <VscOrganization className='me-2' /> Company
            </NavItem>
            <NavItem to={ROUTES.organization.department}>
              <LuBuilding2 className='me-2' /> Department
            </NavItem>
            <NavItem to={ROUTES.organization.designation}>
              <BsPersonVideo2 className='me-2' /> Designation
            </NavItem>
            <NavItem to={ROUTES.organization.dutyType}>
              <FaBusinessTime className='me-2' />
              &nbsp;Duty Type
            </NavItem>
            <NavItem to={ROUTES.organization.salaryType}>
              <FaMoneyBills className='me-2' /> Salary Type
            </NavItem>
            <NavItem to={ROUTES.organization.settings}>
              <FaWrench className='me-2' /> Settings
            </NavItem>
          </AccordionItem>
        </div>
      </ProtectedComponent>

      <ProtectedComponent rolesAllowed={['SuperAdmin']}>
        <div className='accordion mt-1'>
          <AccordionItem
            active={location.pathname.startsWith(ROUTES.approval._)}
            className='pe-0'
            contentJSX={
              <>
                <FaBuildingNgo className='me-2' />
                &nbsp;Approval
              </>
            }
          >
            <NavItem to={ROUTES.approval.branch}>
              <FaMapLocationDot className='me-2' /> Branch
            </NavItem>
            <NavItem to={ROUTES.approval.company}>
              <VscOrganization className='me-2' /> Company
            </NavItem>
            <NavItem to={ROUTES.approval.department}>
              <LuBuilding2 className='me-2' /> Department
            </NavItem>
            <NavItem to={ROUTES.approval.designation}>
              <BsPersonVideo2 className='me-2' /> Designation
            </NavItem>
            <NavItem to={ROUTES.approval.dutyType}>
              <FaBusinessTime className='me-2' />
              &nbsp;Duty Type
            </NavItem>
            <NavItem to={ROUTES.approval.salaryType}>
              <FaMoneyBills className='me-2' /> Salary Type
            </NavItem>
            <NavItem to={ROUTES.approval.employee}>
              <FaWrench className='me-2' /> Employee
            </NavItem>
          </AccordionItem>
        </div>
      </ProtectedComponent>

      <NavItem to={ROUTES.report}>
        <FaChartGantt className='me-2' /> Reports
      </NavItem>
      <Footer />
    </>
  )
}

export default SidebarItems
