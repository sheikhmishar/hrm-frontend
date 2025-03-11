import ServerSITEMAP from '../constants/SERVER_SITEMAP'
import { getEmployeeId } from '../libs'

import Employee from 'backend/Entities/Employee'

//  TODO: add Id

const EmployeeName: React.FC<{
  employee: Pick<
    Employee,
    | 'id'
    | 'dateOfJoining'
    | 'email'
    | 'name'
    | 'designation'
    | 'status'
    | 'photo'
  >
}> = ({
  employee: { id, dateOfJoining, designation, email, name, photo, status }
}) => (
  <div className='align-items-center d-flex gap-2 py-2 text-muted'>
    <strong>{getEmployeeId({ id, dateOfJoining })}</strong>
    <span className='text-primary'>|</span>
    <div className='me-1 position-relative'>
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
      <span
        className={
          'badge position-absolute rounded-circle start-100 top-0 translate-middle ' +
          (status === 'active' ? 'bg-success' : 'bg-danger')
        }
        style={{ height: 15, width: 15 }}
      >
        <span className='visually-hidden'>Status {status}</span>
      </span>
    </div>
    <div>
      <p style={{ fontSize: 12 }} className='fw-lighter m-0 text-info'>
        {email}
      </p>
      <p className='fw-bold m-0 text-nowrap'>{name}</p>
      <p style={{ fontSize: 12 }} className='fw-lighter m-0 text-muted'>
        {designation.name}
      </p>
    </div>
  </div>
)

export default EmployeeName
