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

const placeholder = (
  <div className='placeholder-glow placeholder-wave'>
    <div className='col-6 placeholder' />
    <div className='col-8 placeholder' />
    <div className='col-12 placeholder' />
    <div className='col-7 placeholder' />
    <div
      className='col-7 my-2 placeholder rounded'
      style={{ height: '40vh' }}
    />
    <br />
    <div className='col-3 placeholder rounded' style={{ height: 40 }} />
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
      <Route path='*' element={<NotFound404 />} />
    </ReactRoutes>
  </Suspense>
)

export default Routes
