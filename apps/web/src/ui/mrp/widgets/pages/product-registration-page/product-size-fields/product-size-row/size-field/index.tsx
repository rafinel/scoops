import type { ReactNode } from 'react'

import { Label } from '@/ui/shadcn/label'

const FIELD_CLASS = 'grid min-w-0 content-start gap-1.5'
const LABEL_CLASS = 'text-xs font-semibold text-muted-foreground'
const ERROR_CLASS = 'text-xs text-destructive'

export type SizeFieldProps = {
  children: ReactNode
  error?: string
  id: string
  label: string
}

export const SizeField = ({ children, error, id, label }: SizeFieldProps) => (
  <div className={FIELD_CLASS}>
    <Label className={LABEL_CLASS} htmlFor={id}>
      {label}
    </Label>
    {children}
    {error ? (
      <span className={ERROR_CLASS} id={`${id}-error`}>
        {error}
      </span>
    ) : null}
  </div>
)
