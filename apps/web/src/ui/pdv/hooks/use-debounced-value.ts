import { useEffect, useState } from 'react'

export function useDebouncedValue<Value>(
  value: Value,
  delayMs: number,
  shouldSkipDelay = false,
): Value {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    if (shouldSkipDelay) {
      setDebouncedValue(value)
      return
    }
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs)

    return () => clearTimeout(timeout)
  }, [value, delayMs, shouldSkipDelay])

  return debouncedValue
}
