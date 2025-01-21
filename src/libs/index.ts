import Employee from 'backend/Entities/Employee'

export const capitalize = (value: string) =>
  `${(value[0] || '').toUpperCase()}${value.substring(1)}`

const delim = '_',
  replace = '_id_'
export const capitalizeDelim = (value: string) =>
  value.replace(replace, '').split(delim).map(capitalize).join(' ')

export const timeToLocaleString = (time: string) =>
  new Date('2000-01-01T' + time).toLocaleTimeString()

export const mToHM = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return `${hours ? `${hours} hours ` : ''}${
    remaining ? `${remaining} minutes` : ''
  }`
}

export const stringToDate = (str: string) => new Date(str.replace(/-/g, '/'))

export const dateToString = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`

export const getPreviousMonth = (date: Date) => {
  const newDate = new Date(date)
  newDate.setMonth((newDate.getMonth() + 12 - 1) % 12)
  newDate.setFullYear(
    newDate.getMonth() === 11
      ? newDate.getFullYear() - 1
      : newDate.getFullYear()
  )
  return newDate
}

export const getNextMonth = (date: Date) => {
  const newDate = new Date(date)
  newDate.setMonth((newDate.getMonth() + 1) % 12)
  newDate.setFullYear(
    newDate.getMonth() === 0 ? newDate.getFullYear() + 1 : newDate.getFullYear()
  )
  return newDate
}

export const getDateRange = (date: Date) => {
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
  return [from, to] as const
}

export const dayDifference = (date1: Date, date2: Date, absolute = true) => {
  let timestampDiff = date1.getTime() - date2.getTime()
  if (absolute) timestampDiff = Math.abs(timestampDiff)
  return (
    Math.floor(timestampDiff / (3600000 * 24)) + (timestampDiff < 0 ? -1 : 1)
  )
}

const nameOfDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export default function generateCalender(from: Date, to: Date) {
  const firstDay = from.getDay()

  const date = new Date(from)
  date.setDate(date.getDate() - 1)
  const daysInMonth = new Array(dayDifference(from, to)).fill(null).map(() => {
    date.setTime(date.getTime() + 24 * 3600000)
    return dateToString(date).substring(5)
  })

  return daysInMonth.map((date, i) => ({
    dayName: nameOfDays[(firstDay + i) % 7] as (typeof nameOfDays)[number],
    date: date.substring(3),
    month: date.substring(0, 2)
  }))
}

type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>

type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>

type MonthDay = IntRange<1, 32> | -1

export const getWeekData = (
  from: Date,
  monthlyCalender: ReturnType<typeof generateCalender>
): MonthDay[][] => {
  const firstDay = from.getDay()
  const totalDays = monthlyCalender.length
  const data: MonthDay[][] = []

  const lastDateOfFirstMonth = new Date(
    from.getFullYear(),
    from.getMonth() + 1,
    0
  ).getDate() as IntRange<28, 32>

  let day = 15 as Exclude<MonthDay, -1>
  for (let row = 0; day - 15 < totalDays; row++) {
    const week: MonthDay[] = []
    for (let col = 0; col < 7; col++) {
      if (row === 0 && col < firstDay) {
        week.push(-1)
      } else if (day - 15 >= totalDays) {
        week.push(-1)
      } else {
        week.push(
          day > lastDateOfFirstMonth
            ? ((day % lastDateOfFirstMonth) as typeof day)
            : day
        )
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

export const getEmployeeId = (
  employee: Pick<Employee, 'dateOfJoining' | 'id'>
) =>
  employee.dateOfJoining.substring(2).substring(0, 5).replace('-', '') +
  (employee.id % 100).toString().padStart(2, '0')

export function splitGrossSalary(gross: number) {
  const basic = Math.ceil((gross - 2450) / 1.5)
  return {
    food: 1250,
    conveyance: 450,
    medical: 750,
    basic,
    houseRent: Math.ceil(basic / 2)
  }
}

export const encodeMultipartBody = (body: object) => {
  const formData = new FormData()
  formData.append('json', JSON.stringify(body))
  return formData
}
