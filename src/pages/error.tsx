import React from 'react'
import type { ErrorInfo } from 'react'

import Button from '../components/Button'

type State = {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends React.Component<any, State> {
  constructor(props: any) {
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
