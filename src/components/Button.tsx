import React from 'react'

type ButtonProps = JSX.IntrinsicElements['button'] & {
  className: string
}

const Button: React.FC<ButtonProps> = ({ className, children, ...props }) => (
  <button {...props} className={`btn px-3 py-2 ${className || ''}`}>
    {children}
  </button>
)

export default Button
