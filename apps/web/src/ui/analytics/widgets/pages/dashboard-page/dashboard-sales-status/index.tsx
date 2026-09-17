import type { ReactNode } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type DashboardSalesStatusProps = {
  children: ReactNode
  hasSalesData: boolean
}

export const DashboardSalesStatus = ({
  children,
  hasSalesData,
}: DashboardSalesStatusProps) => {
  if (hasSalesData) return <>{children}</>

  return (
    <section
      aria-labelledby='dashboard-sales-empty-heading'
      className='flex min-h-64 flex-col justify-center rounded-2xl border border-dashed bg-card p-6 shadow-card sm:p-8 lg:order-1'
    >
      <span className='grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary'>
        <Icon name='shopping-cart' className='size-6' />
      </span>
      <h2 id='dashboard-sales-empty-heading' className='mt-4 text-lg font-extrabold'>
        Ainda não há dados suficientes
      </h2>
      <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
        Registre sua primeira venda para acompanhar a evolução, os produtos mais vendidos
        e os canais de venda neste período.
      </p>
      <Button
        className='mt-5 self-start shadow-primary'
        render={<Anchor route='newSale' />}
      >
        <Icon name='plus' /> Registrar primeira venda
      </Button>
    </section>
  )
}
