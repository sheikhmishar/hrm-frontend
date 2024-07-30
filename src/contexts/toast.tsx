import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type PropsWithChildren
} from 'react';

type Toast = { type: 'MESSAGE' | 'ERROR'; message: string; fade?: true }
type ToastContext = {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (toast: Toast) => void
  onErrorDisplayToast: (e: { message: string }) => void
}

export const ToastContext = createContext<ToastContext>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
  onErrorDisplayToast: () => {}
})

const ToastProvider: FC<PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  const removeToast = useCallback(
    (toastToRemove: Toast) =>
      setToasts(toasts => toasts.filter(toast => toast !== toastToRemove)),
    [setToasts]
  )

  const timeoutSetWithAutoRemove = useCallback((fn: () => void, ms: number) => {
    const timeout = setTimeout(() => {
      fn()
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== timeout)
    }, ms)
    timeoutsRef.current.push(timeout)
  }, [])

  const addToast = useCallback(
    (message: string, type: Toast['type'] = 'MESSAGE') => {
      if (toasts.length > 8) return

      const toast: Toast = { type, message }
      const toastFade: Toast = { ...toast, fade: true }
      setToasts(toasts => [...toasts, toastFade])

      timeoutSetWithAutoRemove(
        () =>
          setToasts(toasts => toasts.map(t => (t === toastFade ? toast : t))),
        25
      )
      timeoutSetWithAutoRemove(
        () =>
          setToasts(toasts => toasts.map(t => (t === toast ? toastFade : t))),
        5850
      )
      timeoutSetWithAutoRemove(() => removeToast(toastFade), 6000)
    },
    [toasts.length, setToasts, timeoutSetWithAutoRemove, removeToast]
  )

  const onErrorMessage = useCallback(
    (e: { message: string }) => addToast(e.message, 'ERROR'),
    [addToast]
  )

  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), [])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        onErrorDisplayToast: onErrorMessage
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export default ToastProvider
