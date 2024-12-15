import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import { getEmployeeId } from '../libs'

//  TODO: add Id

const EmployeeName: React.FC<{
  employee: {
    id: number
    dateOfJoining: string
    email: string
    designation: string
    name: string
    photo?: string
  }
}> = ({ employee: { id, dateOfJoining, designation, email, name, photo } }) => (
  <div className='align-items-center d-flex gap-2 py-2 text-muted'>
    <strong>{getEmployeeId({ id, dateOfJoining })}</strong>
    <span className='text-primary'>|</span>
    <img
      src={
        photo
          ? photo.startsWith('blob:')
            ? photo
            : import.meta.env.REACT_APP_BASE_URL +
              ServerSITEMAP.static.employeePhotos +
              '/' +
              photo
          : '/favicon.png'
      }
      width='50'
      height='50'
      className='object-fit-cover rounded-circle'
    />
    <div>
      <p style={{ fontSize: 12 }} className='fw-lighter m-0 text-info'>
        {email}
      </p>
      <p className='fw-bold m-0 text-nowrap'>{name}</p>
      <p style={{ fontSize: 12 }} className='fw-lighter m-0 text-muted'>
        {designation}
      </p>
    </div>
  </div>
)

export default EmployeeName
