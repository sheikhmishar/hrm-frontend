import { useContext, useEffect } from 'react'

import { AuthContext } from '../contexts/auth'

const AwaitingApproval = () => {
  const { refetchAuth } = useContext(AuthContext)

  useEffect(() => {
    const interval = setInterval(refetchAuth, 7500)

    return () => clearInterval(interval)
  }, [refetchAuth])

  return <>Awaiting Confirmation</>
}

export default AwaitingApproval
