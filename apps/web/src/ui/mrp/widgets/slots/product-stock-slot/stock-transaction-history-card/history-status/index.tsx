import type { ReactNode } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { cn } from '@/ui/shared/lib/utils'

export type HistoryStatusProps = {
  children?: ReactNode
  icon: 'clipboard-list' | 'clock' | 'triangle-alert'
  isAnimated?: boolean
  text: string
}

export const HistoryStatus = ({
  children,
  icon,
  isAnimated = false,
  text,
}: HistoryStatusProps) => (
  <div
    className='grid min-h-52 place-items-center border-t border-border-soft p-8 text-center'
    role={icon === 'triangle-alert' ? 'alert' : 'status'}
  >
    <div>
      <Icon
        className={cn(
          'mx-auto size-6 text-muted-foreground',
          isAnimated && 'animate-pulse',
        )}
        name={icon}
      />
      <p className='mt-3 text-sm text-muted-foreground'>{text}</p>
      {children ? <div className='mt-4'>{children}</div> : null}
    </div>
  </div>
)
