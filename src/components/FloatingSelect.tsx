import React, { useCallback, useMemo, useState } from 'react'
import type {
  ChangeEvent,
  ChangeEventHandler,
  FocusEventHandler,
  MouseEventHandler
} from 'react'

import useTimeout from '../hooks/useTimeout'

type DropdownElement = HTMLSelectElement & { label: string }
export type DropDownEventHandler = ChangeEventHandler<DropdownElement>

type Props = JSX.IntrinsicElements['select'] & {
  label: string
  id: string
  options: { label: string; value: string | number }[]
  value: string | number
  containerClass?: string
  onChange?: DropDownEventHandler
  autoComplete?: 'true'
}

const FloatingSelect: React.FC<Props> = ({
  label,
  options,
  containerClass = '',
  className = '',
  ...props
}) => {
  const [focus, setFocus] = useState(false)
  const [text, setText] = useState('')
  const selectedLabel = useMemo(
    () =>
      options.find(({ value: v }) => v.toString() === props.value?.toString())
        ?.label || '',
    [options, props.value]
  )

  const onTextChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    e => setText(e.target.value),
    []
  )
  const onTextFocus = useCallback<FocusEventHandler<HTMLInputElement>>(
    () => !props.disabled && setFocus(true),
    [props.disabled]
  )

  const disableFocusTimeout300 = useTimeout(() => setFocus(false), 300)

  const onSelectChange = useCallback<
    (e: ChangeEvent<DropdownElement>) => MouseEventHandler<HTMLAnchorElement>
  >(
    e => mE => {
      mE.preventDefault()
      props.onChange?.(e)
      setText('')
    },
    [props.onChange]
  )

  const matched20Data = useMemo(
    () =>
      options
        .filter(({ label }) => label.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 20),
    [options, text]
  )

  if (!props.autoComplete) {
    if (label)
      return (
        <div className='form-floating'>
          <select
            {...props}
            aria-label={'Select ' + label}
            name={props.id}
            className={`form-control form-select my-2 shadow-sm ${className}`}
          >
            <option value={undefined}></option>
            {options.map((option, i) => (
              <option key={i} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label htmlFor={props.id}>{label}</label>
        </div>
      )

    return (
      <select
        {...props}
        name={props.id}
        className={`form-control form-select my-2 shadow-sm ${className}`}
      >
        <option value={undefined}></option>
        {options.map((option, i) => (
          <option key={i} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className={`my-3 ${containerClass}`}>
      <div className='form-floating position-relative'>
        <input
          id={`${props.id}_search`}
          name={`${props.id}_search`}
          placeholder='Search'
          value={text}
          disabled={props.disabled}
          onChange={onTextChange}
          className={`form-control shadow-sm ${
            focus ? 'rounded-bottom-0' : ''
          }`}
          onFocus={onTextFocus}
          onBlur={disableFocusTimeout300.start}
        />
        <label htmlFor={`${props.id}_search`} className='text-wrap'>
          {label} - {selectedLabel}
        </label>

        <div className='dropdown end-0 position-absolute start-0 top-100 w-100 z-3'>
          <div
            style={{ maxHeight: 200 }}
            className={`dropdown-menu overflow-auto rounded-top-0 shadow-sm w-100 ${
              focus ? 'show' : ''
            }`}
            aria-labelledby='dropdownMenuButton'
          >
            <a
              href=' '
              onClick={onSelectChange({
                target: { name: props.id, id: props.id, label: '', value: '' }
              } as ChangeEvent<DropdownElement>)}
              className='btn dropdown-item text-light'
            >
              {'.'}
            </a>
            {matched20Data.map(({ label, value }) => (
              <a
                key={value}
                href=' '
                onClick={onSelectChange({
                  target: {
                    name: props.id,
                    id: props.id,
                    label,
                    value: value.toString()
                  }
                } as ChangeEvent<DropdownElement>)}
                className={`btn dropdown-item ${
                  value.toString() === props.value.toString()
                    ? 'bg-primary text-light'
                    : ''
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FloatingSelect
