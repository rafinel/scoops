import type { ComponentProps } from 'react'

import { Input } from '@/ui/shadcn/input'
import { cn } from '@/ui/shared/lib/utils'

const AFFIXED_INPUT_CONTROL_CLASS =
  'flex min-w-0 overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20'
const AFFIX_CLASS =
  'grid shrink-0 place-items-center bg-muted px-3 text-sm font-bold text-muted-foreground'
const AFFIXED_INPUT_CLASS =
  'h-10 min-w-0 flex-1 border-0 px-3 font-bold shadow-none focus-visible:ring-0 aria-invalid:ring-0'

export type AffixedInputProps = ComponentProps<'input'> & {
  prefixText?: string
  suffixText?: string
}

export const AffixedInput = ({
  className,
  prefixText,
  suffixText,
  ...inputProps
}: AffixedInputProps) => (
  <div className={AFFIXED_INPUT_CONTROL_CLASS}>
    {prefixText ? (
      <span className={cn(AFFIX_CLASS, 'border-r')}>{prefixText}</span>
    ) : null}
    <Input
      {...inputProps}
      className={cn(AFFIXED_INPUT_CLASS, className)}
      data-focus-ring='delegated'
    />
    {suffixText ? (
      <span className={cn(AFFIX_CLASS, 'border-l')}>{suffixText}</span>
    ) : null}
  </div>
)
