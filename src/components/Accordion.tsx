import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import useTimeout from '../hooks/useTimeout'

interface Props
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  content: JSX.Element
  active?: boolean
}

const TIMEOUT = 250

const AccordionItem: React.FC<Props> = props => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { children, content, active, className, ...restProps } = props

  const [progress, setProgress] = useState<0 | 50 | 100>(active ? 100 : 0)
  const [dropDownStyle, setDropDownStyle] = useState<CSSProperties>({})

  const dropdownStyleBlankTimeout50 = useTimeout(() => setDropDownStyle({}), 50)
  const dropdownStyleHeightTimeout50 = useTimeout(
    () => setDropDownStyle({ height: dropdownRef.current?.scrollHeight }),
    50
  )
  const progress0TimeoutMax = useTimeout(() => setProgress(0), TIMEOUT)
  const progress100StyleTimeoutMax = useTimeout(() => {
    setProgress(100)
    setDropDownStyle({})
  }, TIMEOUT)
  const progress0Timeout50 = useTimeout(() => setProgress(0), 50)

  const onDropdownClick = useCallback(() => {
    if (progress === 100) {
      setDropDownStyle({ height: dropdownRef.current?.scrollHeight })
      setProgress(50)
      dropdownStyleBlankTimeout50.start()
      progress0TimeoutMax.start()
    } else if (progress === 0) {
      setProgress(50)
      dropdownStyleHeightTimeout50.start()
      progress100StyleTimeoutMax.start()
    } else progress0Timeout50.start()
  }, [
    dropdownStyleBlankTimeout50,
    dropdownStyleHeightTimeout50,
    progress,
    progress0Timeout50,
    progress0TimeoutMax,
    progress100StyleTimeoutMax
  ])

  useEffect(() => {
    if (active && !progress) onDropdownClick()
  }, [active, onDropdownClick, progress])

  return (
    <div className='accordion-item border-0'>
      <h2 className='accordion-header'>
        <button
          className={`accordion-button p-3 ${
            !progress ? 'collapsed' : 'border-start border-5'
          }  `}
          type='button'
          data-bs-toggle='collapse'
          data-bs-target='#'
          aria-expanded={!!progress}
          onClick={onDropdownClick}
        >
          {content}
        </button>
      </h2>
      <div
        className={`accordion-collapse ${
          progress === 50 ? 'collapsing' : 'collapse'
        } ${progress === 100 ? 'show' : ''}`}
        style={dropDownStyle}
      >
        <div
          className={'accordion-body py-1 ' + className || ''}
          {...restProps}
          ref={dropdownRef}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default AccordionItem
