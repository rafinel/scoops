import { useEffect, useLayoutEffect, useState } from 'react'

export function usePricingEnvironment() {
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [isDocumentVisible, setIsDocumentVisible] = useState(true)

  useLayoutEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    function handlePreferenceChange() {
      setIsReducedMotion(preference.matches)
    }
    handlePreferenceChange()
    preference.addEventListener('change', handlePreferenceChange)
    return () => preference.removeEventListener('change', handlePreferenceChange)
  }, [])

  useEffect(() => {
    function handleVisibilityChange() {
      setIsDocumentVisible(!document.hidden)
    }
    handleVisibilityChange()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return { isReducedMotion, isDocumentVisible }
}
