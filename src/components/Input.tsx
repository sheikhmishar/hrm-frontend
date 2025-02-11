import {
  ChangeEvent,
  FocusEventHandler,
  MouseEventHandler,
  forwardRef,
  useCallback,
  useMemo,
  useState
} from 'react'

import useTimeout from '../hooks/useTimeout'

type InputProps = JSX.IntrinsicElements['input'] & {
  autoComplete?: 'true'
  label: string
  id: string
  containerClass?: string
  options?: string[]
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      autoComplete,
      options = [],
      className = '',
      containerClass = '',
      ...props
    },
    ref
  ) => {
    const [inputFocus, setInputFocus] = useState(false)
    const [dropdownFocus, setDropdownFocus] = useState(false)

    const disableInputFocusTimeout300 = useTimeout(
      () => setInputFocus(false),
      300
    )
    const disableDropdownFocusTimeout300 = useTimeout(
      () => setDropdownFocus(false),
      300
    )

    const onTextFocus = useCallback<FocusEventHandler<HTMLInputElement>>(() => {
      if (!props.disabled && autoComplete === 'true') {
        disableInputFocusTimeout300.end()
        setInputFocus(true)
      }
    }, [
      props.disabled,
      autoComplete,
      disableInputFocusTimeout300,
      setInputFocus
    ])

    const onDropdownFocus = useCallback<
      FocusEventHandler<HTMLInputElement>
    >(() => {
      if (!props.disabled && autoComplete === 'true') {
        disableDropdownFocusTimeout300.end()
        setDropdownFocus(true)
      }
    }, [
      props.disabled,
      autoComplete,
      disableDropdownFocusTimeout300,
      setDropdownFocus
    ])

    const onSelectChange = useCallback<
      (e: ChangeEvent<HTMLInputElement>) => MouseEventHandler<HTMLAnchorElement>
    >(
      e => _ => {
        props.onChange?.(e)
        disableInputFocusTimeout300.start()
        disableDropdownFocusTimeout300.start()
      },
      [
        props.onChange,
        disableInputFocusTimeout300,
        disableDropdownFocusTimeout300
      ]
    )

    const matched20Data = useMemo(
      () =>
        options
          .filter(option =>
            option
              .toLowerCase()
              .includes(props.value?.toString().toLowerCase() || '')
          )
          .slice(0, 20),
      [options, props.value]
    )

    return (
      <div className={containerClass}>
        <div className='position-relative'>
          <label htmlFor={props.id} className='form-label'>
            {label} {props.required && <span className='text-primary'>*</span>}
          </label>
          <input
            {...props}
            ref={ref}
            name={props.id}
            className={`form-control ${
              autoComplete === 'true' &&
              matched20Data.length &&
              (inputFocus || dropdownFocus)
                ? 'rounded-bottom-0'
                : ''
            } ${className}`}
            onFocus={onTextFocus}
            onBlur={disableInputFocusTimeout300.start}
          />

          <div className='dropdown end-0 position-absolute start-0 top-100 w-100 z-3'>
            <div
              style={{ maxHeight: 200 }}
              className={`dropdown-menu overflow-auto rounded-top-0 shadow-sm w-100 ${
                inputFocus || dropdownFocus ? 'show' : ''
              }`}
              onFocus={onDropdownFocus}
              onBlur={disableDropdownFocusTimeout300.start}
              aria-labelledby='dropdownMenuButton'
            >
              <a
                href='javascript:void(0);'
                onClick={onSelectChange({
                  target: { name: props.id, id: props.id, value: '' }
                } as ChangeEvent<HTMLInputElement>)}
                className='btn dropdown-item text-light'
              >
                {'.'}
              </a>
              {matched20Data.map(value => (
                <a
                  key={value}
                  href='javascript:void(0);'
                  onClick={onSelectChange({
                    target: {
                      name: props.id,
                      id: props.id,
                      value: value.toString()
                    }
                  } as ChangeEvent<HTMLInputElement>)}
                  className={`btn dropdown-item ${
                    value.toString() === props.value?.toString()
                      ? 'bg-primary text-light'
                      : ''
                  }`}
                >
                  {value}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

export default Input
