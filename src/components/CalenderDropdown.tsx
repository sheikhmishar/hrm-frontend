import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler
} from 'react'
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io'

import { getNextMonth, getPreviousMonth } from '../libs'

type Prop = JSX.IntrinsicElements['div'] & {
  currentDate: Date
  setCurrentDate: SetState<Date>
  monthly?: boolean
}

const CalenderSlider = ({
  currentDate,
  setCurrentDate,
  monthly,
  className,
  ...props
}: Prop) => {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const datePickerRef = useRef<HTMLInputElement>(null)
  const handleDatePickerClick = () => setShowDatePicker(!showDatePicker)
  const handleDatePickerBlur = () => setShowDatePicker(false)

  useEffect(() => {
    const onPickerClick = () => setShowDatePicker(false)
    if (showDatePicker) {
      datePickerRef.current?.showPicker()
      document.getElementById('root')?.addEventListener('click', onPickerClick)
    } else {
      datePickerRef.current?.blur()
      document
        .getElementById('root')
        ?.removeEventListener('click', onPickerClick)
    }
    return () =>
      document
        .getElementById('root')
        ?.removeEventListener('click', onPickerClick)
  }, [showDatePicker])

  const handlePrevMonth = () => setCurrentDate(getPreviousMonth(currentDate))

  const handleNextMonth = () =>
    setCurrentDate((prevDate: Date) => getNextMonth(prevDate))

  const handleDateChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { valueAsDate }
  }) => {
    if (monthly && valueAsDate) valueAsDate.setDate(15)
    setCurrentDate(valueAsDate || new Date())
    setShowDatePicker(false)
  }

  const monthName = useMemo(
    () =>
      (
        currentDate.toLocaleString('en-US', { month: 'long' }).split(',')[0] ||
        ''
      ).split(' ')[0],
    [currentDate]
  )

  return (
    <div className={`d-inline-block ${className}`} {...props}>
      <div
        role='button'
        className='align-items-center border d-flex gap-1 justify-content-between position-relative px-2 py-2 rounded-3 user-select-none'
      >
        <span onClick={handlePrevMonth}>
          <IoIosArrowBack size={17} />
        </span>
        <span
          className='fw-bold text-nowrap text-primary'
          onClick={handleDatePickerClick}
        >
          {monthly ? '' : currentDate.getDate()} {monthName}{' '}
          {currentDate.getFullYear()}
        </span>
        <span className='position-absolute start-0 top-50 visually-hidden'>
          <input
            ref={datePickerRef}
            type={monthly ? 'month' : 'date'}
            value={currentDate.toISOString().substring(0, monthly ? 7 : 10)}
            onChange={handleDateChange}
            onBlur={handleDatePickerBlur}
          />
        </span>
        <span onClick={handleNextMonth}>
          <IoIosArrowForward size={17} />
        </span>
      </div>
    </div>
  )
}

export default CalenderSlider
