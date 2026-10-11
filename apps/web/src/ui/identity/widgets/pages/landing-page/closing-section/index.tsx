import { buttonVariants } from '@/ui/shadcn/button'
import { cn } from '@/ui/shared/lib/utils'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { CLOSING_PHRASE, CLOSING_WORDS } from './content'
import { LandingClosingStarfield } from './starfield'
import { useLandingClosingSection } from './use-landing-closing-section'
import { LandingClosingWord } from './word'
import './closing-section.css'

export const LandingClosingSection = () => {
  const { scope, scrollYProgress, canHighlight, isReducedMotion, canAnimate } =
    useLandingClosingSection()

  return (
    <section
      ref={scope}
      className='landing-closing'
      aria-labelledby='landing-closing-title'
      data-highlight={canHighlight}
      data-reduced-motion={isReducedMotion}
      data-animating={canAnimate}
    >
      <LandingClosingStarfield />
      <div className='landing-closing-content'>
        <h2 id='landing-closing-title' aria-label={CLOSING_PHRASE}>
          {CLOSING_WORDS.map((word, index) => (
            <LandingClosingWord
              key={word}
              word={word}
              index={index}
              progress={scrollYProgress}
              canHighlight={canHighlight}
            />
          ))}
        </h2>
        <p className='landing-closing-support'>
          Conecte estoque, produção e vendas com o Scoops.
        </p>
        <Anchor
          route='onboarding'
          className={cn(buttonVariants({ variant: 'secondary' }), 'landing-closing-cta')}
        >
          Começar teste grátis
        </Anchor>
        <p className='landing-closing-trial'>14 dias grátis, sem cartão de crédito.</p>
      </div>
    </section>
  )
}
