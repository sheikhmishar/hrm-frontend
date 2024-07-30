import { useCallback, useEffect, useMemo, useState } from 'react'

const useLocalStorage = (key: string) => {
  const [value, _setValue] = useState(localStorage.getItem(key))

  const setValue = useCallback((value: string | null) => {
    try {
      if (value) localStorage.setItem(key, value)
      else localStorage.removeItem(key)
      _setValue(value)
    } catch (error) {
      _setValue(null)
    }
  }, [key])

  useEffect(() => {
    _setValue(localStorage.getItem(key))

    const onStorageEvent = () => _setValue(localStorage.getItem(key))
    window.addEventListener('storage', onStorageEvent)
    return () => window.removeEventListener('storage', onStorageEvent)
  }, [key])

  return useMemo(() => ({ value, setValue }), [setValue, value])
}

export default useLocalStorage
