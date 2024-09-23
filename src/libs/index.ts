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
