import type { SalesAnalytics } from '@scoops/core/analytics/domain/structures'
import { XIcon } from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { Icon } from '@/ui/shared/widgets/components/icon'
import {
  useSalesEvolutionTableDialog,
  type SalesEvolutionTableDialogControllerProps,
} from './use-sales-evolution-table-dialog'

export type SalesEvolutionTableDialogProps = SalesEvolutionTableDialogControllerProps & {
  analytics: SalesAnalytics
  open: boolean
}

export const SalesEvolutionTableDialog = ({
  analytics,
  onOpenChange,
  open,
}: SalesEvolutionTableDialogProps) => {
  const { handleOpenChange } = useSalesEvolutionTableDialog({ onOpenChange })
  const formatCurrency = useFormatCurrency()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='max-h-[calc(100dvh-2rem)] sm:max-w-[720px]'
      >
        <DialogHeader className='border-b border-border-soft p-6 pr-14'>
          <span className='grid size-9 place-items-center rounded-lg bg-accent text-primary'>
            <Icon name='clipboard-list' className='size-4' />
          </span>
          <DialogTitle>Dados da evolução das vendas</DialogTitle>
          <DialogDescription>
            Valores vendidos e pedidos válidos em cada período selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[min(65vh,520px)] overflow-y-auto'>
          <div className='p-6'>
            <table className='w-full min-w-72 text-left text-sm'>
              <caption className='sr-only'>Vendas por período</caption>
              <thead className='sticky top-0 z-10 bg-card text-xs uppercase text-muted-foreground'>
                <tr className='border-b'>
                  <th className='py-2 pr-4'>Período</th>
                  <th className='pr-4'>Vendas</th>
                  <th>Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {analytics.evolution.map((bucket) => (
                  <tr
                    key={bucket.key}
                    className='border-b border-border-soft last:border-0'
                  >
                    <td className='py-2.5 pr-4'>{bucket.label}</td>
                    <td className='pr-4'>{formatCurrency(bucket.netSalesCents / 100)}</td>
                    <td>{bucket.validOrders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <DialogClose
          render={
            <Button
              variant='outline'
              size='icon-sm'
              className='absolute top-4 right-4 rounded-lg text-muted-foreground'
            />
          }
        >
          <XIcon />
          <span className='sr-only'>Fechar tabela</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
