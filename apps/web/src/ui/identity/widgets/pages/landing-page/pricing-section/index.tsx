import { LandingPricingCopy } from './copy'
import { LandingPricingOffer } from './offer'
import { useLandingPricingSection } from './use-landing-pricing-section'
import './pricing-section.css'

export const LandingPricingSection = () => {
  const { scope, isReducedMotion, canAnimate } = useLandingPricingSection()

  return (
    <section
      ref={scope}
      className='landing-pricing'
      aria-labelledby='landing-pricing-title'
      data-animating={canAnimate}
      data-reduced-motion={isReducedMotion}
    >
      <div className='landing-pricing-light-field' aria-hidden='true'>
        <div
          className='landing-pricing-light landing-pricing-glow'
          data-pricing-light='first'
        />
        <div
          className='landing-pricing-light landing-pricing-glow'
          data-pricing-light='second'
        />
      </div>
      <div className='landing-pricing-layout'>
        <LandingPricingCopy />
        <div className='landing-pricing-offer-column' data-pricing-enter='3'>
          <LandingPricingOffer />
        </div>
      </div>
    </section>
  )
}
