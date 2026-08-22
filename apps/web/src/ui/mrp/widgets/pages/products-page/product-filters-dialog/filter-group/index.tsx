import type { ReactNode } from 'react'

export type FilterGroupProps = {
  children: ReactNode
  label: string
}

export const FilterGroup = ({ children, label }: FilterGroupProps) => (
  <fieldset>
    <legend className='mb-2 text-[11px] font-semibold uppercase tracking-[0.5px] text-muted-foreground'>
      {label}
    </legend>
    <div className='flex flex-wrap gap-2'>{children}</div>
  </fieldset>
)
