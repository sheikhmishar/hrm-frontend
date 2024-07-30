import React from 'react'

const year = new Date().getFullYear() // TODO: all new Date() from constant

const Footer: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <footer className={`mt-auto py-2 py-md-4 ${!dark ? 'text-light' : ''}`}>
    <div className='container text-center'>
      Copyright &copy; 2023{year > 2023 ? '-' + year : ''} | Rosetech Solutions
      Ltd.
    </div>
  </footer>
)

export default Footer
