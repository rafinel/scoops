import { useEffect, useState } from 'react'
import type { EstablishmentTimezone } from '@scoops/core/identity/domain/structures'

export const useTimezoneDialog = (initial: EstablishmentTimezone) => {
  const [timeZone, setTimeZone] = useState(initial)
  useEffect(() => setTimeZone(initial), [initial])
  return { timeZone, setTimeZone }
}
