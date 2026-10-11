import { LandingShowcase } from './showcase'
import { LandingTeamSection } from './team-section'
import { LandingPricingSection } from './pricing-section'
import { LandingFaqSection } from './faq-section'
import { LandingClosingSection } from './closing-section'
import { LandingFooter } from './footer'
import { LandingHero } from './hero'
import { LandingNavigation } from './navigation'
import { LandingSurface } from './surface'
import { useLandingPage } from './use-landing-page'

export const LandingPage = () => {
  const { scope, handleEntranceComplete } = useLandingPage()

  return (
    <div
      ref={scope}
      onFocusCapture={handleEntranceComplete}
      onKeyDownCapture={handleEntranceComplete}
      onPointerDownCapture={handleEntranceComplete}
      className='landing-page min-h-screen bg-card p-3 font-sans md:p-6'
    >
      <div className='flex flex-col gap-3 md:gap-6'>
        <LandingSurface>
          <LandingNavigation />
          <main>
            <LandingHero />
          </main>
        </LandingSurface>
        <LandingConnectedSection />
        <LandingShowcase />
        <LandingTeamSection />
        <LandingPricingSection />
        <LandingFaqSection />
        <LandingClosingSection />
        <LandingFooter />
      </div>
    </div>
  )
}
import { LandingConnectedSection } from './connected-section'
