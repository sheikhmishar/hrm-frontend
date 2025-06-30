import { useContext } from 'react'

import Routes from './Routes'
import Navbar from './components/Navbar'
import SidebarItems from './components/SidebarItems'
import ToastContainer from './components/ToastContainer'
import { AuthContext } from './contexts/auth'
import { SettingContext } from './contexts/setting'
import ErrorBoundary from './pages/error'

export default function App() {
  const { self } = useContext(AuthContext)
  const { settings } = useContext(SettingContext)

  const mainContent = (
    <main className='p-3'>
      <ErrorBoundary>
        <Routes />
      </ErrorBoundary>
    </main>
  )

  if (!self || !settings.length)
    return (
      <>
        <ToastContainer />
        {mainContent}
      </>
    )

  return (
    <div className='container-fluid'>
      <ToastContainer />

      <div className='row'>
        <div className='col-lg-2 col-md-3 d-md-block d-none px-0 shadow-sm vh-100 z-1'>
          <nav className='bg-primary-dark container-fluid h-100 overflow-y-auto shadow-sm'>
            <ul className='h-100 navbar-nav pt-3'>
              <SidebarItems />
            </ul>
          </nav>
        </div>
        <div className='col-12 col-lg-10 col-md-9 d-flex flex-column px-0 vh-100'>
          <Navbar />
          <div className='bg-light container-fluid flex-grow-1 overflow-y-auto'>
            {mainContent}
          </div>
        </div>
      </div>
    </div>
  )
}
