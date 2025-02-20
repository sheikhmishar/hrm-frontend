import { Suspense, lazy, type ComponentType } from 'react'
import { Routes as ReactRoutes, Route } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import Redirect from './components/Redirect'
import { ROUTES } from './constants/CONSTANTS'
import NotFound404 from './pages/404'
import AwaitingApproval from './pages/awaiting-approval'
import Login from './pages/login'
import UpdatePassword from './pages/password'
import Register from './pages/register'
import User from './pages/user'

const delayedLazy = <T extends ComponentType>(
  factory: () => Promise<{ default: T }>
) =>
  lazy<T>(() =>
    Promise.all([
      new Promise(resolve => setTimeout(resolve, 250)),
      new Promise<{ default: T }>(resolve =>
        factory().then(({ default: C }) => resolve({ default: C }))
      )
    ]).then(([, C]) => C)
  )

const DashboardLazy = delayedLazy(() => import('./pages/dashboard'))
const EmployeeListLazy = delayedLazy(() => import('./pages/employee/list'))
const EmployeeDetailsLazy = delayedLazy(
  () => import('./pages/employee/details/[id]')
)
const EmployeeAssetsLazy = delayedLazy(() => import('./pages/employee/assets'))
const EmployeeNoticesLazy = delayedLazy(
  () => import('./pages/employee/notices')
)
const LeaveAssignedLazy = delayedLazy(() => import('./pages/leave/assigned'))
const LeaveCalenderLazy = delayedLazy(() => import('./pages/leave/calender'))
const LeaveDetailsLazy = delayedLazy(
  () => import('./pages/leave/calender/[id]')
)
const AttendanceImportLazy = delayedLazy(
  () => import('./pages/attendance/import')
)
const AttendanceMonthlyLazy = delayedLazy(
  () => import('./pages/attendance/monthly')
)
const AttendanceDetailsLazy = delayedLazy(
  () => import('./pages/attendance/monthly/[id]')
)
const AttendanceHistoryLazy = delayedLazy(
  () => import('./pages/attendance/history')
)
const HolidayManagementLazy = delayedLazy(
  () => import('./pages/attendance/holiday')
)
const PayrollUpdateLazy = delayedLazy(() => import('./pages/payroll/update'))
const PayrollMonthlyLazy = delayedLazy(() => import('./pages/payroll/monthly'))
const LoanLazy = delayedLazy(() => import('./pages/payroll/loan'))
const LoanByIdLazy = delayedLazy(() => import('./pages/payroll/loan/[id]'))
const SalaryCostLazy = delayedLazy(() => import('./pages/payroll/cost'))
const PayrollByIdLazy = delayedLazy(() => import('./pages/payroll/[id]'))

const BranchLazy = delayedLazy(() => import('./pages/organization/branch'))
const CompanyLazy = delayedLazy(() => import('./pages/organization/company'))
const DepartmentLazy = delayedLazy(
  () => import('./pages/organization/department')
)
const DesignationLazy = delayedLazy(
  () => import('./pages/organization/designation')
)
const DutyTypeLazy = delayedLazy(() => import('./pages/organization/duty-type'))
const SalaryTypeLazy = delayedLazy(
  () => import('./pages/organization/salary-type')
)
const SettingsLazy = delayedLazy(() => import('./pages/organization/settings'))
const ReportLazy = delayedLazy(() => import('./pages/report'))

const placeholder = (
  <div className='placeholder-glow placeholder-wave'>
    <div className='col-6 placeholder' />
    <div className='col-8 placeholder' />
    <div className='col-12 placeholder' />
    <div className='col-7 placeholder' />
    <div
      className='col-7 my-2 placeholder rounded-3'
      style={{ height: '40vh' }}
    />
    <br />
    <div className='col-3 placeholder rounded-3' style={{ height: 40 }} />
  </div>
)

const Routes = () => (
  <Suspense fallback={placeholder}>
    <ReactRoutes>
      <Route path={ROUTES.root} element={<Redirect to={ROUTES.login} />} />
      <Route
        path={ROUTES.login}
        element={
          <ProtectedRoute unAuthenticatedOnly>
            <Login />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.register}
        element={
          <ProtectedRoute unAuthenticatedOnly>
            <Register />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.password}
        element={
          <ProtectedRoute authenticatedOnly>
            <UpdatePassword />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.awaitingApproval}
        element={
          <ProtectedRoute authenticatedOnly>
            <AwaitingApproval />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.user}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin']}>
            <User />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.dashboard}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <DashboardLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.employee.list}
        element={
          <ProtectedRoute authenticatedOnly>
            <EmployeeListLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.employee.details}
        element={
          <ProtectedRoute authenticatedOnly>
            <EmployeeDetailsLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.employee.assets}
        element={
          <ProtectedRoute authenticatedOnly>
            <EmployeeAssetsLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.employee.notices}
        element={
          <ProtectedRoute authenticatedOnly>
            <EmployeeNoticesLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.attendance.import}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <AttendanceImportLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.attendance.monthly}
        element={
          <ProtectedRoute authenticatedOnly>
            <AttendanceMonthlyLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.attendance.details}
        element={
          <ProtectedRoute authenticatedOnly>
            <AttendanceDetailsLazy />
            {/* TODO: reuse monthly */}
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.attendance.history}
        element={
          <ProtectedRoute authenticatedOnly>
            <AttendanceHistoryLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.attendance.holiday}
        element={
          <ProtectedRoute authenticatedOnly>
            <HolidayManagementLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.leave.assigned}
        element={
          <ProtectedRoute authenticatedOnly>
            <LeaveAssignedLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.leave.details}
        element={
          <ProtectedRoute authenticatedOnly>
            <LeaveDetailsLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.leave.calender}
        element={
          <ProtectedRoute authenticatedOnly>
            <LeaveCalenderLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.payroll.update}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <PayrollUpdateLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.payroll.updateById}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <PayrollUpdateLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.payroll.id}
        element={
          <ProtectedRoute authenticatedOnly>
            <PayrollByIdLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.payroll.monthly}
        element={
          <ProtectedRoute authenticatedOnly>
            <PayrollMonthlyLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.payroll.loan}
        element={
          <ProtectedRoute authenticatedOnly>
            <LoanLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.payroll.loanById}
        element={
          <ProtectedRoute authenticatedOnly>
            <LoanByIdLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.payroll.cost}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <SalaryCostLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.branch}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <BranchLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.company}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <CompanyLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.department}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <DepartmentLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.designation}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <DesignationLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.dutyType}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <DutyTypeLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.salaryType}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <SalaryTypeLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.settings}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin', 'HR']}>
            <SettingsLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.approval.branch}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin']}>
            <BranchLazy approval />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.approval.company}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin']}>
            <CompanyLazy approval />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.approval.department}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin']}>
            <DepartmentLazy approval />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.approval.designation}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin']}>
            <DesignationLazy approval />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.approval.dutyType}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin']}>
            <DutyTypeLazy approval />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.approval.salaryType}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin']}>
            <SalaryTypeLazy approval />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.approval.employee}
        element={
          <ProtectedRoute rolesAllowed={['SuperAdmin']}>
            <EmployeeListLazy approval />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.report}
        element={
          <ProtectedRoute authenticatedOnly>
            <ReportLazy />
          </ProtectedRoute>
        }
      />
      <Route path='*' element={<NotFound404 />} />
    </ReactRoutes>
  </Suspense>
)

export default Routes
