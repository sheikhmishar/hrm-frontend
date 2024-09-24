import { Suspense, lazy, type ComponentType } from 'react'
import { Routes as ReactRoutes, Route } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import Redirect from './components/Redirect'
import { ROUTES } from './constants/CONSTANTS'
import NotFound404 from './pages/404'
import Login from './pages/login'
import Register from './pages/register'

const delayedLazy = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) =>
  lazy<T>(() =>
    Promise.all([
      new Promise(resolve => setTimeout(resolve, 250)),
      new Promise<{ default: T }>(resolve =>
        factory().then(({ default: C }) => resolve({ default: C }))
      )
    ]).then(([_, C]) => C)
  )

const DashboardLazy = delayedLazy(() => import('./pages/dashboard'))
const EmployeeListLazy = delayedLazy(() => import('./pages/employee/list'))
const EmployeeDetailsLazy = delayedLazy(
  () => import('./pages/employee/details')
)
const EmployeeAssetsLazy = delayedLazy(() => import('./pages/employee/assets'))
const EmployeeNoticesLazy = delayedLazy(
  () => import('./pages/employee/notices')
)
const LeaveAssignedLazy = delayedLazy(() => import('./pages/leave/assigned'))
const LeaveCalenderLazy = delayedLazy(() => import('./pages/leave/calender'))
const LeaveDetailsLazy = delayedLazy(
  () => import('./pages/leave/calender/[details]')
)
const AttendanceImportLazy = delayedLazy(
  () => import('./pages/attendance/import')
)
const AttendanceMonthlyLazy = delayedLazy(
  () => import('./pages/attendance/monthly')
)
const AttendanceDetailsLazy = delayedLazy(
  () => import('./pages/attendance/monthly/[details]')
)
const AttendanceHistoryLazy = delayedLazy(
  () => import('./pages/attendance/monthly/history')
)
const PayrollUpdateLazy = delayedLazy(() => import('./pages/payroll/update'))
const PayrollMonthlyLazy = delayedLazy(() => import('./pages/payroll/monthly'))

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
        path={ROUTES.dashboard}
        element={
          <ProtectedRoute authenticatedOnly>
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
          <ProtectedRoute authenticatedOnly>
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
          <ProtectedRoute authenticatedOnly>
            <PayrollUpdateLazy />
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
        path={ROUTES.organization.branch}
        element={
          <ProtectedRoute authenticatedOnly>
            <BranchLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.company}
        element={
          <ProtectedRoute authenticatedOnly>
            <CompanyLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.department}
        element={
          <ProtectedRoute authenticatedOnly>
            <DepartmentLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.designation}
        element={
          <ProtectedRoute authenticatedOnly>
            <DesignationLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.dutyType}
        element={
          <ProtectedRoute authenticatedOnly>
            <DutyTypeLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.salaryType}
        element={
          <ProtectedRoute authenticatedOnly>
            <SalaryTypeLazy />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.organization.settings}
        element={
          <ProtectedRoute authenticatedOnly>
            <SettingsLazy />
          </ProtectedRoute>
        }
      />
      <Route path='*' element={<NotFound404 />} />
    </ReactRoutes>
  </Suspense>
)

export default Routes
