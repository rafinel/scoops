import { useLayoutEffect, useState } from 'react'
import { TEAM_PROFILES, type TeamProfile } from './content'

export function useLandingTeamSection() {
  const [activeId, setActiveId] = useState<TeamProfile['id']>('operator')
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const activeProfile =
    TEAM_PROFILES.find((profile) => profile.id === activeId) ?? TEAM_PROFILES[1]

  useLayoutEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    function syncPreference() {
      setIsReducedMotion(preference.matches)
    }
    syncPreference()
    preference.addEventListener('change', syncPreference)
    return () => preference.removeEventListener('change', syncPreference)
  }, [])

  function handleSelectProfile(id: TeamProfile['id']) {
    setActiveId(id)
  }

  function handleHoverProfile(id: TeamProfile['id']) {
    if (document.activeElement?.matches('.landing-team-card:focus-visible')) return
    setActiveId(id)
  }

  return {
    activeId,
    activeProfile,
    isReducedMotion,
    handleSelectProfile,
    handleHoverProfile,
  }
}
