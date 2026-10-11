import { Fragment } from 'react'
import { LandingFaqAnswer } from './answer'
import { LANDING_FAQ_QUESTIONS } from './content'
import { LandingFaqQuestionButton } from './question'
import { useLandingFaqSection } from './use-landing-faq-section'
import './faq-section.css'

export const LandingFaqSection = () => {
  const { scope, activeId, isReducedMotion, canAnimate, handleSelectQuestion } =
    useLandingFaqSection()

  return (
    <section
      ref={scope}
      className='landing-faq'
      aria-labelledby='landing-faq-title'
      data-reduced-motion={isReducedMotion}
      data-animating={canAnimate}
    >
      <div className='landing-faq-decoration' aria-hidden='true'>
        <div className='landing-faq-arc' data-faq-arc />
      </div>
      <div className='landing-faq-content'>
        <h2 id='landing-faq-title'>Antes de começar, tire suas dúvidas.</h2>
        <div className='landing-faq-layout'>
          {LANDING_FAQ_QUESTIONS.map((question) => (
            <Fragment key={question.id}>
              <LandingFaqQuestionButton
                question={question}
                isSelected={activeId === question.id}
                onSelect={handleSelectQuestion}
              />
              {activeId === question.id && (
                <LandingFaqAnswer question={question} isReducedMotion={isReducedMotion} />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
