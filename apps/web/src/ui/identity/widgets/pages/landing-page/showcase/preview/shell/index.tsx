import type { ReactNode } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'
import type { IconName } from '@/ui/shared/widgets/components/icon/types/icon-name'

export type PreviewShellProps = {
  kind: 'sales' | 'production' | 'results'
  children: ReactNode
}

const MENU_ITEMS: { kind: PreviewShellProps['kind']; label: string; icon: IconName }[] = [
  { kind: 'results', label: 'Dashboard', icon: 'layout-dashboard' },
  { kind: 'sales', label: 'Vendas', icon: 'shopping-bag' },
  { kind: 'production', label: 'Produção', icon: 'chef-hat' },
]

export const PreviewShell = ({ kind, children }: PreviewShellProps) => (
  <div className='flex h-[540px] min-w-[800px] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm'>
    <div className='flex w-44 shrink-0 flex-col border-r border-border bg-card p-5'>
      <div className='mb-10 flex items-center gap-2 text-primary'>
        <Icon name='ice-cream-cone' className='size-6' />
        <span className='text-xl font-extrabold italic'>Scoops</span>
      </div>
      <div className='space-y-2 text-xs font-bold'>
        {MENU_ITEMS.map((item) => (
          <div
            key={item.kind}
            className={`flex items-center gap-3 rounded-lg px-3 py-3 ${kind === item.kind ? 'bg-primary-soft text-primary' : 'text-muted-foreground'}`}
          >
            <Icon name={item.icon} className='size-4' />
            {item.label}
          </div>
        ))}
        <div className='flex items-center gap-3 px-3 py-3 text-muted-foreground'>
          <Icon name='package' className='size-4' />
          Estoque
        </div>
      </div>
      <div className='mt-auto flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground'>
        <Icon name='store' className='size-4' />
        Sua sorveteria
      </div>
    </div>
    <div className='min-w-0 flex-1 bg-background'>
      <div className='flex h-14 items-center justify-between border-b border-border bg-card px-6'>
        <span className='text-xs font-medium text-muted-foreground'>
          Visão da operação
        </span>
        <span className='rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground'>
          Dados ilustrativos
        </span>
      </div>
      <div className='p-6'>{children}</div>
    </div>
  </div>
)
