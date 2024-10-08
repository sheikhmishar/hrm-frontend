import Employee from 'backend/Entities/Employee'

export const SatisfiesKey = <T>(k: keyof T) => k
export const Satisfies = <T>(k: T) => k

export const capitalize = (value: string) =>
  `${(value[0] || '').toUpperCase()}${value.substring(1)}`

const delim = '_',
  replace = '_id_'
export const capitalizeDelim = (value: string) =>
  value.replace(replace, '').split(delim).map(capitalize).join(' ')

export const getPreviousMonth = (date: Date | string) => {
  const newDate = new Date(date)
  newDate.setMonth((newDate.getMonth() + 12 - 1) % 12)
  newDate.setFullYear(
    newDate.getMonth() === 11
      ? newDate.getFullYear() - 1
      : newDate.getFullYear()
  )
  return newDate
}

export const getNextMonth = (date: Date | string) => {
  const newDate = new Date(date)
  newDate.setMonth((newDate.getMonth() + 1) % 12)
  newDate.setFullYear(
    newDate.getMonth() === 0 ? newDate.getFullYear() + 1 : newDate.getFullYear()
  )
  return newDate
}

export const getDateRange = (date: Date | string) => {
  let [from, to] = [new Date(date), new Date(date)]
  if (from.getDate() < 15) {
    from = getPreviousMonth(from)
    from.setDate(15)
    to.setDate(14)
  } else {
    from.setDate(15)
    to = getNextMonth(to)
    to.setDate(14)
  }
  return [from, to] as [Date, Date]
}

// const daysInYear = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31].map(
//   (days, i) => new Array(days).fill(null).map((_, i) => i)
// )

const nameOfDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export default function generateCalender(from: Date, to: Date) {
  const firstDay = from.getDay()

  const date = new Date(from)
  date.setDate(date.getDate() - 1)
  const daysInMonth = new Array(
    (to.getTime() - from.getTime()) / (24 * 3600000) + 1
  )
    .fill(null)
    .map(() => {
      date.setTime(date.getTime() + 24 * 3600000)
      return date.toISOString().substring(0, 10).substring(5)
    })

  return daysInMonth.map((date, i) => ({
    dayName: nameOfDays[(firstDay + i) % 7] as (typeof nameOfDays)[number],
    date: date.substring(3),
    month: date.substring(0, 2)
  }))
}

export const getWeekData = (
  from: Date,
  monthlyCalender: ReturnType<typeof generateCalender>
): number[][] => {
  const firstDay = from.getDay()
  const totalDays = monthlyCalender.length
  const data: number[][] = []

  const lastDateOfFirstMonth = new Date(
    from.getFullYear(),
    from.getMonth() + 1,
    0
  ).getDate()

  let day = 15
  for (let row = 0; day - 15 < totalDays; row++) {
    const week: number[] = []
    for (let col = 0; col < 7; col++) {
      if (row === 0 && col < firstDay) {
        week.push(-1)
      } else if (day - 15 >= totalDays) {
        week.push(-1)
      } else {
        week.push(day > lastDateOfFirstMonth ? day % lastDateOfFirstMonth : day)
        day++
      }
    }
    data.push(week)
  }

  return data
}

export function downloadStringAsFile(
  data: string,
  filename: string,
  options: BlobPropertyBag
) {
  const link = document.createElement('a')
  const file = new Blob([data], options)
  link.href = URL.createObjectURL(file)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
  link.remove()
}

export const getEmployeeId = (employee: Employee) =>
  employee.dateOfJoining.substring(2).substring(0, 5) +
  '-' +
  employee.id.toString().padStart(4, '0')
