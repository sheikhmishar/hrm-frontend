import type { IncomingHttpHeaders } from 'http'

export const tokenRef = { current: '' } as { current: string | null }

const { REACT_APP_BASE_URL } = import.meta.env

const modifiedFetch = async <T>(
  input: RequestInfo | URL,
  init: RequestInit & {
    headers?: IncomingHttpHeaders & RequestInit['headers']
    method?: 'get' | 'post' | 'put' | 'delete'
  } = {}
) => {
  if (init) {
    init.headers = Object.assign<HeadersInit, IncomingHttpHeaders>(
      init.headers || {},
      {
        'authorization': `Bearer ${tokenRef.current}`,
        'ngrok-skip-browser-warning': 'true',
        'mode': 'cors',
        'accept': 'application/json',
        'content-type': init.headers?.['content-type'] || 'application/json'
      }
    )
    if (
      init.headers['content-type'] === 'multipart/form-data' ||
      init.body instanceof FormData
    )
      delete init.headers['content-type']
  }
  const res = await fetch((REACT_APP_BASE_URL || '') + input, init)
  if (!res.ok) throw await res.json()
  return (await res.json()) as T
} // TODO: make robust

export default modifiedFetch
