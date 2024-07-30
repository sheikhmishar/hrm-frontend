import { useEffect, useState, type FC, type PropsWithChildren } from 'react'

import useTimeout from '../hooks/useTimeout'

type SidebarClass = '' | 'show' | 'showing' | 'hiding show'

type Prop = {
  show: boolean
  directionClass?:
    | 'offcanvas-start'
    | 'offcanvas-end'
    | 'offcanvas-top'
    | 'offcanvas-bottom'
  onClose: () => void
} & PropsWithChildren

const Offcanvas: FC<Prop> = ({
  show,
  onClose,
  directionClass = 'offcanvas-start',
  children
}) => {
  const [sidebar, setSidebar] = useState<SidebarClass>('')
  const sidebarShowTimeout = useTimeout(() => setSidebar('show'), 250)
  const sidebarHideTimeout = useTimeout(() => setSidebar(''), 250)

  useEffect(() => {
    if (show) {
      setSidebar('showing')
      sidebarShowTimeout.start()
    } else {
      setSidebar('hiding show')
      sidebarHideTimeout.start()
    }
  }, [show, sidebarHideTimeout, sidebarShowTimeout])

  return (
    <>
      {sidebar && (
        <div
          onClick={onClose}
          className={`fade modal-backdrop show ${
            directionClass === 'offcanvas-start' ? 'd-md-none' : ''
          }`}
        />
      )}

      <div
        className={`border-0 offcanvas pt-3 ${directionClass} ${sidebar} ${
          directionClass === 'offcanvas-start'
            ? 'bg-primary-dark d-md-none'
            : ''
        }`}
      >
        <div className='end-0 offcanvas-header position-absolute top-0'>
          <span className='me-auto offcanvas-title' />
          <button
            type='button'
            className={`border-0 btn-close rounded-5 ${
              directionClass === 'offcanvas-end' ? ' btn-close-white' : ''
            }`}
            aria-label='Close'
            onClick={onClose}
          />
        </div>
        <div className='offcanvas-body pt-0'>
          <ul className='min-h-100 navbar-nav overflow-y-auto'>{children}</ul>
        </div>
      </div>
    </>
  )
}

export default Offcanvas
