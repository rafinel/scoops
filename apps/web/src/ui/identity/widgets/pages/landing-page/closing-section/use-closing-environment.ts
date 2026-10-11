import { useLayoutEffect, useState } from 'react'
import { usePricingEnvironment } from '@/ui/identity/widgets/pages/landing-page/pricing-section/use-pricing-environment'

export function useClosingEnvironment() {
  const { isReducedMotion, isDocumentVisible } = usePricingEnvironment()
  const [isDesktopPointer, setIsDesktopPointer] = useState(false)

  useLayoutEffect(() => {
    const preference = matchMedia('(min-width: 768px) and (pointer: fine)')
    function handlePointerChange() {
      setIsDesktopPointer(preference.matches)
    }
    handlePointerChange()
    preference.addEventListener('change', handlePointerChange)
    return () => preference.removeEventListener('change', handlePointerChange)
  }, [])

  return {
    isReducedMotion,
    isDocumentVisible,
    canHighlight: isDesktopPointer && !isReducedMotion,
  }
}
