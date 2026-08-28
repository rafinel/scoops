import { useEffect, useRef } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrderVerificationStateProps = {
  isVisible: boolean
  message?: string
}

export const OrderVerificationState = ({
  isVisible,
  message = 'Aguarde enquanto confirmamos o registro do pedido.',
}: OrderVerificationStateProps) => {
  const verificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isVisible) return
    const focusTimer = window.setTimeout(() => verificationRef.current?.focus(), 0)
    return () => window.clearTimeout(focusTimer)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      aria-live='polite'
      aria-label='Verificando registro'
      className='fixed inset-0 z-40 grid place-items-center bg-black/35 p-4'
      ref={verificationRef}
      role='status'
      tabIndex={-1}
    >
      <div className='w-full max-w-md rounded-2xl bg-card p-6 text-center shadow-dialog'>
        <span className='mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary'>
          <Icon
            className='size-6 animate-pulse motion-reduce:animate-none'
            name='clock'
          />
        </span>
        <h2 className='mt-4 text-xl font-black'>Verificando registro</h2>
        <p className='mt-2 text-sm text-muted-foreground'>{message}</p>
      </div>
    </div>
  )
}
