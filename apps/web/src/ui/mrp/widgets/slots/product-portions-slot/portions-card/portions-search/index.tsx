import type { Ref } from 'react'

import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type PortionsSearchProps = {
  inputRef: Ref<HTMLInputElement>
  onChange: (search: string) => void
  value: string
}

export const PortionsSearch = ({ inputRef, onChange, value }: PortionsSearchProps) => (
  <Label className='flex h-12 w-full items-center gap-2.5 rounded-xl border bg-card px-4 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 sm:w-80'>
    <Icon className='size-4 text-muted-foreground' name='search' />
    <Input
      aria-label='Buscar porção'
      className='h-full border-0 px-0 text-sm font-medium shadow-none focus:ring-0 focus-visible:border-transparent focus-visible:ring-0'
      data-focus-ring='delegated'
      onChange={(event) => onChange(event.target.value)}
      placeholder='Buscar porção'
      ref={inputRef}
      value={value}
    />
  </Label>
)
