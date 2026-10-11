import { useAnimate } from 'motion/react'
import { type RefObject, useLayoutEffect } from 'react'

export function usePricingEntrance(scope: RefObject<HTMLElement | null>) {
  const [, animate] = useAnimate()

  useLayoutEffect(() => {
    const section = scope.current
    if (!section || !('IntersectionObserver' in window)) return
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches) return
    const targets = section.querySelectorAll<HTMLElement>('[data-pricing-enter]')
    const entrances: ReturnType<typeof animate>[] = []
    const desktop = matchMedia('(min-width: 768px)')
    let isDisabled = false
    const observer = new IntersectionObserver(handleViewportEntry, {
      threshold: 0.2,
      rootMargin: '0px 0px -24px 0px',
    })

    for (const target of targets) {
      target.style.opacity = '0'
      observer.observe(target)
    }

    function handleViewportEntry(entries: IntersectionObserverEntry[]) {
      if (isDisabled || preference.matches) return
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const target = entry.target as HTMLElement
        observer.unobserve(target)
        entrances.push(
          animate(
            target,
            { opacity: [0, 1], y: [20, 0] },
            {
              duration: 0.7,
              delay: desktop.matches ? Number(target.dataset.pricingEnter) * 0.16 : 0,
              ease: [0.16, 1, 0.3, 1],
            },
          ),
        )
      }
    }

    function finishEntrance() {
      isDisabled = true
      observer.disconnect()
      for (const entrance of entrances) entrance.complete()
      restorePricingVisibility(targets)
    }

    function handleMotionPreference() {
      if (preference.matches) finishEntrance()
    }

    preference.addEventListener('change', handleMotionPreference)
    section.addEventListener('focusin', finishEntrance)
    section.addEventListener('pointerdown', finishEntrance)
    return () => {
      isDisabled = true
      observer.disconnect()
      preference.removeEventListener('change', handleMotionPreference)
      section.removeEventListener('focusin', finishEntrance)
      section.removeEventListener('pointerdown', finishEntrance)
      for (const entrance of entrances) entrance.stop()
      restorePricingVisibility(targets)
    }
  }, [animate, scope])
}

function restorePricingVisibility(targets: NodeListOf<HTMLElement>) {
  for (const target of targets) {
    target.style.removeProperty('opacity')
    target.style.removeProperty('transform')
  }
}
