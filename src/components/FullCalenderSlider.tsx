import {
  useEffect,
  useRef,
  useState,
  useMemo,
  type ChangeEventHandler
} from 'react'
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io'

type Prop = {
  currentDate: Date
  setCurrentDate: SetState<Date>
} & JSX.IntrinsicElements['div']

const CalenderSlider = ({
  currentDate,
  setCurrentDate,
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

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth((newDate.getMonth() + 12 - 1) % 12)
    newDate.setFullYear(
      newDate.getMonth() === 11
        ? newDate.getFullYear() - 1
        : newDate.getFullYear()
    )
    setCurrentDate(newDate)
  }

  const handleNextMonth = () =>
    setCurrentDate((prevDate: Date) => {
      prevDate = new Date(currentDate)
      prevDate.setMonth((prevDate.getMonth() + 1) % 12)
      prevDate.setFullYear(
        prevDate.getMonth() === 0
          ? prevDate.getFullYear() + 1
          : prevDate.getFullYear()
      )
      return prevDate
    })

  const handleDateChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { valueAsDate }
  }) => {
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
          {currentDate.getDate()} {monthName} {currentDate.getFullYear()}
        </span>
        <span className='position-absolute start-0 top-50 visually-hidden'>
          <input
            ref={datePickerRef}
            type='date'
            value={currentDate.toISOString().split('T')[0]}
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
