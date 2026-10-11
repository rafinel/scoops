import { useLayoutEffect, useEffect, useState } from 'react'

export function useShowcaseEnvironment() {
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [canStack, setCanStack] = useState(false)
  const [isDocumentVisible, setIsDocumentVisible] = useState(true)

  useLayoutEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const desktop = matchMedia(
      '(min-width: 1024px) and (min-height: 700px) and (pointer: fine)',
    )
    function syncPreferences() {
      setIsReducedMotion(reduced.matches)
      setCanStack(desktop.matches && !reduced.matches)
    }
    syncPreferences()
    reduced.addEventListener('change', syncPreferences)
    desktop.addEventListener('change', syncPreferences)
    return () => {
      reduced.removeEventListener('change', syncPreferences)
      desktop.removeEventListener('change', syncPreferences)
    }
  }, [])

  useEffect(() => {
    function syncVisibility() {
      setIsDocumentVisible(!document.hidden)
    }
    syncVisibility()
    document.addEventListener('visibilitychange', syncVisibility)
    return () => document.removeEventListener('visibilitychange', syncVisibility)
  }, [])
  return { isReducedMotion, canStack, isDocumentVisible }
}
