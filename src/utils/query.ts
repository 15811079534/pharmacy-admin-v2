const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export const formatLocalDateTime = (value: Date) => {
  const yyyy = value.getFullYear()
  const mm = `${value.getMonth() + 1}`.padStart(2, '0')
  const dd = `${value.getDate()}`.padStart(2, '0')
  const hh = `${value.getHours()}`.padStart(2, '0')
  const mi = `${value.getMinutes()}`.padStart(2, '0')
  const ss = `${value.getSeconds()}`.padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

export const normalizeQueryParamDates = <T>(value: T): T => {
  if (value instanceof Date) {
    return formatLocalDateTime(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeQueryParamDates(item)) as T
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeQueryParamDates(item)])
    ) as T
  }

  return value
}

const formatLocalDate = (value: Date) => formatLocalDateTime(value).slice(0, 10)

const normalizeDateRangeBoundary = (value: string | Date, boundary: 'start' | 'end') => {
  if (value instanceof Date) {
    return `${formatLocalDate(value)} ${boundary === 'start' ? '00:00:00' : '23:59:59'}`
  }

  const normalized = value.trim()
  if (!normalized) {
    return ''
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized} ${boundary === 'start' ? '00:00:00' : '23:59:59'}`
  }
  return normalized
}

export const normalizeDateRangeToDayBounds = (range?: Array<string | Date>) => {
  if (!Array.isArray(range) || range.length !== 2) {
    return undefined
  }

  const [start, end] = range
  if (!start || !end) {
    return undefined
  }

  const normalizedStart = normalizeDateRangeBoundary(start, 'start')
  const normalizedEnd = normalizeDateRangeBoundary(end, 'end')
  if (!normalizedStart || !normalizedEnd) {
    return undefined
  }

  return [normalizedStart, normalizedEnd]
}
