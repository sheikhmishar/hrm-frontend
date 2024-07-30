import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Redirect({ to }: { to: string }) {
  const navigate = useNavigate()

  useEffect(() => navigate(to), [])

  return <></>
}
