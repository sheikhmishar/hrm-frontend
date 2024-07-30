import React, { forwardRef } from 'react'

type FloatingInputProps = JSX.IntrinsicElements['input'] & {
  label: string
  id: string
  containerClass?: string
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, className, containerClass = '', ...props }, ref) => (
    <div className={`form-floating ${containerClass}`}>
      <input
        {...props}
        ref={ref}
        name={props.id}
        className={`form-control ${className || ''}`}
      />
      <label htmlFor={props.id}>{label}</label>
    </div>
  )
)

export default FloatingInput
