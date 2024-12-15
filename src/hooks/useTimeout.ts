import { useCallback, useEffect, useRef, useMemo } from 'react'

export default function useTimeout<T>(
  callback: (...args: T[]) => void,
  delay: number
) {
  const callbackRef = useRef(callback)
  const timerRef = useRef<NodeJS.Timeout>()
  // TODO: args type

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const start = useCallback(
    (...args: T[]) =>
      (timerRef.current = setTimeout(callbackRef.current, delay, ...args)),
    [delay]
  )
  const end = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = undefined
  }, [delay])

  return useMemo(() => ({ start, end }), [start, end])
}
