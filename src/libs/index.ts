export const SatisfiesKey = <T>(k: keyof T) => k
export const Satisfies = <T>(k: T) => k

export const capitalize = (value: string) =>
  `${(value[0] || '').toUpperCase()}${value.substring(1)}`

const delim = '_',
  replace = '_id_'
export const capitalizeDelim = (value: string) =>
  value.replace(replace, '').split(delim).map(capitalize).join(' ')
