import type { KeyboardEvent } from 'react'

import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { cn } from '@/ui/shared/lib/utils'

export type PortionPickerSearchProps = {
  isDimmed: boolean
  isDisabled: boolean
  onChange: (search: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  value: string
}

export const PortionPickerSearch = ({
  isDimmed,
  isDisabled,
  onChange,
  onKeyDown,
  value,
}: PortionPickerSearchProps) => (
  <div
    className={cn(
      'flex min-h-[39px] items-center gap-2.5 border-b !border-[color:var(--border-soft)] px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring/20',
      isDimmed && 'opacity-60',
    )}
  >
    <Icon className='size-4 shrink-0 text-muted-foreground' name='search' />
    <Input
      aria-label='Buscar porção'
      className='h-auto border-0 p-0 text-sm font-medium shadow-none focus-visible:ring-0'
      data-focus-ring='delegated'
      disabled={isDisabled}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      placeholder='Buscar porção'
      value={value}
    />
  </div>
)
