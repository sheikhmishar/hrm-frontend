import React, { type PropsWithChildren } from 'react'
import type { ErrorInfo } from 'react'

import Button from '../components/Button'

type State = {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends React.Component<PropsWithChildren, State> {
  constructor(props: PropsWithChildren) {
    super(props)
    this.state = { hasError: false, error: undefined, errorInfo: undefined }
  }

  static getDerivedStateFromError = (error: Error, errorInfo: ErrorInfo) =>
    // Update state so the next render will show the fallback UI.
    ({ hasError: true, error, errorInfo })

  componentDidCatch = (error: Error, errorInfo: ErrorInfo) => {
    this.setState({ hasError: true, error, errorInfo })
    // log the error to an error reporting service
    if (!import.meta.env.PROD) console.error(error, errorInfo)
  }

  render() {
    if (this.state.hasError)
      return (
        <>
          <h3>Error Occured. Please Contact the developer</h3>
          {import.meta.env.DEV && (
            <h5 className='text-danger'>{this.state.error?.message}</h5>
          )}
          <Button
            className='btn-danger'
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </Button>
        </>
      )
    return this.props.children
  }
}

export default ErrorBoundary
