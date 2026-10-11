import { LandingTeamCard } from './card'
import { TEAM_PROFILES } from './content'
import { LandingTeamDetail } from './detail'
import { useLandingTeamSection } from './use-landing-team-section'
import './team-section.css'

export const LandingTeamSection = () => {
  const {
    activeId,
    activeProfile,
    isReducedMotion,
    handleSelectProfile,
    handleHoverProfile,
  } = useLandingTeamSection()

  return (
    <section
      className='landing-team'
      aria-labelledby='landing-team-title'
      data-reduced-motion={isReducedMotion}
    >
      <fieldset className='landing-team-fan' aria-label='Conheça os acessos da equipe'>
        {TEAM_PROFILES.map((profile, index) => (
          <LandingTeamCard
            key={profile.id}
            profile={profile}
            position={index}
            isSelected={activeId === profile.id}
            isReducedMotion={isReducedMotion}
            onSelect={handleSelectProfile}
            onHover={handleHoverProfile}
          />
        ))}
      </fieldset>
      <h2 id='landing-team-title' className='landing-team-title'>
        Sua equipe alinhada.
        <br />
        Cada um com seu acesso.
      </h2>
      <p className='landing-team-support'>
        Contas individuais, permissões por perfil e histórico de alterações da equipe.
      </p>
      <LandingTeamDetail profile={activeProfile} />
    </section>
  )
}
