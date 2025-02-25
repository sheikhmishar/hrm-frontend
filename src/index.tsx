import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter as Router } from 'react-router-dom'

import App from './App'
import AuthProvider from './contexts/auth'
import ToastProvider from './contexts/toast'
import ErrorBoundary from './pages/error'
import reportWebVitals from './reportWebVitals'

import './assets/css/bootstrap.css'
import './assets/css/style.css'

reportWebVitals()

if (import.meta.env.PROD) {
  const _ = window as typeof window & {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: { [x: string]: object | null }
  }
  if (typeof _.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object')
    for (const prop in _.__REACT_DEVTOOLS_GLOBAL_HOOK__)
      if (prop === 'renderers')
        // prevents console error when dev tools try to iterate of renderers
        _.__REACT_DEVTOOLS_GLOBAL_HOOK__[prop] = new Map()
      else
        _.__REACT_DEVTOOLS_GLOBAL_HOOK__[prop] =
          typeof _.__REACT_DEVTOOLS_GLOBAL_HOOK__[prop] == 'function'
            ? Function.prototype
            : null
  ;(Object.keys(window) as (keyof typeof window)[]).forEach(
    k => (k as string).includes('_REACT_') && delete window[k]
  )

  if (import.meta.env.REACT_APP_CONTEXT_MENU_DISABLE === 'true')
    document.addEventListener('contextmenu', e => e.preventDefault())
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { networkMode: 'always', refetchOnWindowFocus: false },
    mutations: { networkMode: 'always' }
  }
})

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <ErrorBoundary>
    <React.StrictMode>
      <Router>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </Router>
    </React.StrictMode>
  </ErrorBoundary>
)
