import { useLocation } from 'react-router-dom'

const NotFound: React.FC = () => {
  const location = useLocation()
  return (
    <h2 className='text-center'>
      404 Not Found{' '}
      <span className='px-1 rounded text-bg-danger'>{location.pathname}</span>
    </h2>
  )
}
export default NotFound
