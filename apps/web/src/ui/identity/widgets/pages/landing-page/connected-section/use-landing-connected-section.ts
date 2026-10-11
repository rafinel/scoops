import { useAnimate } from 'motion/react'
import { useLayoutEffect } from 'react'
import { useConnectedFlow } from './use-connected-flow'

export function useLandingConnectedSection() {
  const [scope, animate] = useAnimate<HTMLElement>()
  useConnectedFlow(scope)

  useLayoutEffect(() => {
    if (!scope.current || !('IntersectionObserver' in window)) return
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return
    const targets = scope.current.querySelectorAll<HTMLElement>('[data-connected-enter]')
    const entrances: ReturnType<typeof animate>[] = []
    let isDisabled = false
    const desktop = matchMedia('(min-width: 640px)')
    const observer = new IntersectionObserver(handleViewportEntry, {
      threshold: 0.2,
      rootMargin: '0px 0px -24px 0px',
    })

    for (const target of targets) {
      target.style.opacity = '0'
      observer.observe(target)
    }

    function handleViewportEntry(entries: IntersectionObserverEntry[]) {
      if (isDisabled || reducedMotion.matches) return
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const target = entry.target as HTMLElement
        observer.unobserve(target)
        entrances.push(
          animate(
            target,
            { opacity: [0, 1], y: [20, 0] },
            {
              duration: 0.6,
              delay: desktop.matches ? Number(target.dataset.connectedEnter) * 0.12 : 0,
              ease: [0.16, 1, 0.3, 1],
            },
          ),
        )
      }
    }

    function handleMotionPreference() {
      if (!reducedMotion.matches) return
      isDisabled = true
      observer.disconnect()
      for (const entrance of entrances) entrance.complete()
      restoreVisibleStyles()
    }

    function restoreVisibleStyles() {
      for (const target of targets) {
        target.style.removeProperty('opacity')
        target.style.removeProperty('transform')
      }
    }

    reducedMotion.addEventListener('change', handleMotionPreference)
    return () => {
      isDisabled = true
      observer.disconnect()
      reducedMotion.removeEventListener('change', handleMotionPreference)
      for (const entrance of entrances) entrance.stop()
      restoreVisibleStyles()
    }
  }, [animate, scope])

  return { scope }
}
