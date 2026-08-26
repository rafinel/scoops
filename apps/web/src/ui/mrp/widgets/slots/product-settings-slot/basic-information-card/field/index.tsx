import type { ReactNode } from 'react'

import { Label } from '@/ui/shadcn/label'

export type FieldProps = {
  children: ReactNode
  error?: string
  errorId?: string
  label: string
}

export const Field = ({ children, error, errorId, label }: FieldProps) => (
  <Label className='grid gap-2 text-sm font-bold'>
    {label}
    {children}
    {error ? (
      <span className='text-xs font-semibold text-danger' id={errorId} role='alert'>
        {error}
      </span>
    ) : null}
  </Label>
)
