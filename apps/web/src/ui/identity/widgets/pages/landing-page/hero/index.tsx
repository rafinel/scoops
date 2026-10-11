import { buttonVariants } from '@/ui/shadcn/button'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { cn } from '@/ui/shared/lib/utils'

import { LandingOrderPreview } from '../order-preview'

export const LandingHero = () => (
  <section
    aria-labelledby='landing-title'
    className='flex flex-col items-center gap-8 px-5 pt-10 pb-5 text-center md:gap-12 md:px-16 md:pt-16 md:pb-12'
  >
    <div className='flex w-full flex-col items-center gap-6'>
      <h1
        id='landing-title'
        data-landing-enter='title'
        className='landing-title w-full font-medium'
      >
        <span className='block'>Sua sorveteria organizada. </span>
        <span className='block'>Do estoque à venda.</span>
      </h1>
      <div className='flex w-full max-w-landing-copy flex-col items-center gap-7'>
        <p
          data-landing-enter='copy'
          className='text-base leading-[1.65] text-accent md:text-lg'
        >
          Vendas, estoque e produção em um só lugar. Mais clareza para cuidar da sua
          sorveteria ou loja de açaí.
        </p>
        <div
          data-landing-enter='actions'
          className='flex w-full flex-col items-center gap-3'
        >
          <Anchor
            route='onboarding'
            className={cn(
              buttonVariants({ variant: 'secondary' }),
              'h-14 w-full rounded-lg bg-card text-base font-bold text-primary hover:bg-accent md:w-61',
            )}
          >
            Começar teste grátis
          </Anchor>
          <p className='text-[13px] text-accent'>14 dias grátis. Sem cadastrar cartão.</p>
        </div>
      </div>
    </div>
    <LandingOrderPreview />
  </section>
)
