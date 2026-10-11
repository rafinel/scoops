import { buttonVariants } from '@/ui/shadcn/button'
import { cn } from '@/ui/shared/lib/utils'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

export const LandingPricingCopy = () => (
  <div className='landing-pricing-copy'>
    <h2 id='landing-pricing-title' data-pricing-enter='0'>
      Um plano. Sua sorveteria inteira conectada.
    </h2>
    <p data-pricing-enter='1'>
      Do balcão à produção, todos os recursos do Scoops em uma assinatura mensal.
    </p>
    <Anchor
      data-pricing-enter='2'
      route='onboarding'
      className={cn(buttonVariants(), 'landing-pricing-cta')}
    >
      Começar teste grátis
    </Anchor>
  </div>
)
