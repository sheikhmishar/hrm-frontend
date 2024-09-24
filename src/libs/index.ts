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
