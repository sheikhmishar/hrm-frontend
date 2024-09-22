import { forwardRef } from 'react'

type InputProps = JSX.IntrinsicElements['input'] & {
  label: string
  id: string
  containerClass?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', containerClass = '', ...props }, ref) => (
    <div className={containerClass}>
      <label htmlFor={props.id} className='form-label'>
        {label} {props.required && <span className='text-primary'>*</span>}
      </label>
      <input
        {...props}
        ref={ref}
        name={props.id}
        className={`form-control ${className}`}
      />
    </div>
  )
)

export default Input
