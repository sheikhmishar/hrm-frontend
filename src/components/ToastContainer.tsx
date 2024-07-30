import React, { useContext } from 'react'

import { ToastContext } from '../contexts/toast'

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useContext(ToastContext)

  return (
    <div className='bottom-0 overflow-auto position-absolute pt-4 start-50 toast-container top-0 translate-middle-x vh-100'>
      {toasts.map((toast, i) => (
        <div
          key={i}
          className={`align-items-center border-0 fade mb-2 show toast ${
            toast.type === 'MESSAGE' ? 'text-bg-success' : 'text-bg-danger'
          } ${toast.fade ? 'opacity-0' : ''}`}
          role='alert'
          aria-live='assertive'
          aria-atomic='true'
        >
          <div className='d-flex'>
            <div className='toast-body'>{toast.message}</div>
            <button
              type='button'
              className='btn-close m-auto me-2'
              data-bs-dismiss='toast'
              aria-label='Close'
              onClick={() => removeToast(toast)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
