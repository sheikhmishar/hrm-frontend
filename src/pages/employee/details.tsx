import { Link, useLocation } from 'react-router-dom'
import { BsArrowLeftShort } from 'react-icons/bs'

import { ROUTES } from '../../constants/CONSTANTS'

const ScrollLink: React.FC<
  JSX.IntrinsicElements['a'] & React.PropsWithChildren & { isFirst?: boolean }
> = ({ isFirst, children, ...props }) => {
  const location = useLocation()
  return (
    <a
      {...props}
      role='button'
      className={`nav-link text-nowrap user-select-none ${
        location.hash.endsWith(props.href || '') ||
        (isFirst && !location.hash.includes('#'))
          ? 'border-3 border-bottom border-primary'
          : ''
      }`}
    >
      {children}
    </a>
  )
}

const AddEmployee = () => {
  return (
    <>
      <Link
        role='button'
        className='btn mb-2 text-primary'
        to={ROUTES.employee.list}
      >
        <BsArrowLeftShort size={21} />
        Employee details
      </Link>

      <div className='row'>
        <div className='col-6 col-lg-4 overflow-hidden rounded-3'>
          <div className='bg-white me-1 p-4 rounded-3 shadow-sm'>
            <div className='bg-info-subtle pb-2 rounded-4 text-center w-100'>
              <img
                className='border border-2 border-dark-subtle img-fluid rounded-circle'
                alt='profile-img'
                src='/favicon.png'
              />
              <h4 className='my-2'>xxx</h4>
              <p className='text-muted'>Designation</p>
            </div>
            <div className='my-2 row'>
              <div className='col-5 my-2'>
                <span className='me-auto text-muted'>Employee</span>
              </div>
              <div className='col-7 my-3'>
                <p className='mb-0 text-end'>xxx</p>
              </div>
            </div>
            <div className='row'>
              <div className='col-5 my-2'>
                <span className='me-auto text-muted'>Phone Number</span>
              </div>
              <div className='col-7 my-3'>
                <p className='mb-0 text-end'>xxx</p>
              </div>
            </div>
            <div className='row'>
              <div className='col-5 my-2'>
                <span className='me-auto text-muted'>Email Address</span>
              </div>
              <div className='col-7 my-3'>
                <p className='mb-0 text-end'>xxx</p>
              </div>
            </div>
            <div className='row'>
              <div className='col-5 my-2'>
                <span className='me-auto text-muted'>Date of Birth</span>
              </div>
              <div className='col-7 my-3'>
                <p className='mb-0 text-end'>xxx</p>
              </div>
            </div>
            <div className='row'>
              <div className='col-5 my-2'>
                <span className='me-auto text-muted'>Gender</span>
              </div>
              <div className='col-7 my-3'>
                <p className='mb-0 text-end'>xxx</p>
              </div>
            </div>
            <div className='row'>
              <div className='col-5 my-2'>
                <span className='me-auto text-muted'>Address</span>
              </div>
              <div className='col-7 my-3'>
                <p className='mb-0 text-end'>xxx</p>
              </div>
            </div>
            <div className='row'>
              <div className='col-5 my-2'>
                <span className='me-auto text-muted'>Date of Joining</span>
              </div>
              <div className='col-7 my-3'>
                <p className='mb-0 text-end'>xxx</p>
              </div>
            </div>
            <div className='row'>
              <div className='col-5 my-2'>
                <span className='me-auto text-muted'>Company</span>
              </div>
              <div className='col-7 my-3'>
                <p className='mb-0 text-end'>xxx</p>
              </div>
            </div>
            <div className='row'>
              <div className='col-5 my-2'>
                <span className='me-auto text-muted'>Department</span>
              </div>
              <div className='col-7 my-3'>
                <p className='mb-0 text-end'>xxx</p>
              </div>
            </div>
            <div className='row'>
              <div className='col-5 my-2'>
                <span className='me-auto text-muted'>Duty Type</span>
              </div>
              <div className='col-7 my-3'>
                <p className='mb-0 text-end'>xxx</p>
              </div>
            </div>
          </div>
        </div>
        <div className='col-6 col-lg-8 rounded-3'>
          <div className='border-0 card rounded-3'>
            <div className='card-body'>
              <div className='d-flex gap-3 justify-content-between overflow-x-auto py-2 sticky-top w-100'>
                <ScrollLink isFirst href='#personal-details'>
                  Personal Details
                </ScrollLink>
                <ScrollLink href='#corporate-details'>
                  Corporate Details
                </ScrollLink>
                <ScrollLink href='#documents'>Documents</ScrollLink>
                <ScrollLink href='#financial-details'>
                  Bank account details
                </ScrollLink>
                <ScrollLink href='#contacts'>Emmergency contact</ScrollLink>
                <ScrollLink href='#assets'>Allocated Asset</ScrollLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default AddEmployee
