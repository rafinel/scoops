import { buttonVariants } from '@/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { cn } from '@/ui/shared/lib/utils'

export const LandingNavigation = () => (
  <header
    data-landing-enter='navigation'
    className='flex h-19 items-center justify-between gap-4 px-5 md:h-24 md:px-12'
  >
    <Anchor
      route='root'
      aria-label='Scoops — início'
      className='flex shrink-0 items-center gap-3'
    >
      <span className='grid size-10 place-items-center rounded-lg bg-primary'>
        <Icon name='ice-cream-cone' className='size-[22px]' />
      </span>
      <span className='text-xl font-black italic tracking-tight'>Scoops</span>
    </Anchor>
    <nav aria-label='Navegação da landing' className='hidden items-center gap-8 md:flex'>
      <Anchor route='login' className='py-3 text-sm font-bold hover:underline'>
        Entrar
      </Anchor>
      <Anchor
        route='onboarding'
        className={cn(
          buttonVariants({ variant: 'secondary' }),
          'h-13 bg-card px-6 text-[15px] font-bold text-primary hover:bg-accent',
        )}
      >
        Testar grátis
      </Anchor>
    </nav>
    <div className='md:hidden'>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label='Abrir navegação'
          className='grid size-11 place-items-center rounded-lg hover:bg-primary'
        >
          <Icon name='menu' className='size-6' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='min-w-48'>
          <DropdownMenuItem render={<Anchor route='login' />}>Entrar</DropdownMenuItem>
          <DropdownMenuItem render={<Anchor route='onboarding' />}>
            Testar grátis
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
)
