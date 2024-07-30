import { useCallback, useEffect, useRef, useMemo } from 'react'

export default function useTimeout(
  callback: (...args: any[]) => void,
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
    (...args: any[]) =>
      (timerRef.current = setTimeout(callbackRef.current, delay, ...args)),
    [delay]
  )

  return useMemo(() => ({ start }), [start])
}
