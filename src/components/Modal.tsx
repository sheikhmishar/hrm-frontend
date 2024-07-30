import { useState, useEffect } from 'react'
import Button from './Button'

const ModalBase: React.FC<
  React.PropsWithChildren & { isOpen: boolean; setIsOpen: SetState<boolean> }
> = ({ children, isOpen, setIsOpen }) => {
  const [modalClass, setModalClass] = useState<'' | 'd-block' | 'd-block show'>(
    ''
  )

  useEffect(() => {
    if (isOpen) {
      setModalClass('d-block')
      const timeout = setTimeout(() => setModalClass('d-block show'), 50)

      return () => clearTimeout(timeout)
    }

    setModalClass('d-block')
    const timeout = setTimeout(() => {
      setModalClass('')
    }, 250)

    return () => clearTimeout(timeout)
  }, [isOpen])

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className={`fade modal-backdrop ${modalClass}`}
        />
      )}
      <div
        className={`fade h-auto modal ${modalClass}`}
        tabIndex={-1}
        role='dialog'
        aria-hidden={!isOpen}
      >
        <div className='modal-dialog modal-dialog-scrollable modal-dialog-scrollable'>
          <div className='modal-content'>{children}</div>
        </div>
      </div>
    </>
  )
}

const Header: React.FC<{
  title: string
  close: () => void
}> = ({ title, close }) => (
  <div className='modal-header'>
    <h5 className='modal-title'>{title}</h5>
    <Button
      className='btn-close btn-close-white'
      data-bs-dismiss='modal'
      aria-label='Close'
      onClick={close}
    />
  </div>
)

const Footer: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className='modal-footer'>{children}</div>
)
const Body: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className='modal-body'>{children}</div>
)

const Modal = Object.assign(ModalBase, { Header }, { Body }, { Footer })

export default Modal
