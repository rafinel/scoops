import type { SalesAnalytics } from '@scoops/core/analytics/domain/structures'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

export const CostCoverageDialog = ({
  onClose,
  open,
  analytics,
  children,
}: {
  open: boolean
  onClose: () => void
  analytics?: SalesAnalytics
  children?: React.ReactNode
}) => (
  <Dialog
    open={open}
    onOpenChange={(nextOpen) => {
      if (!nextOpen) onClose()
    }}
  >
    <DialogContent
      className='max-w-[calc(100%-2rem)] sm:!max-w-[456px]'
      showCloseButton={false}
    >
      <DialogHeader className='flex flex-col gap-1 p-6 pr-14'>
        <DialogTitle className='col-auto'>Detalhes da cobertura de custos</DialogTitle>
        <DialogDescription className='col-auto'>
          Custos são preservados no momento do registro da venda.
        </DialogDescription>
      </DialogHeader>
      <DialogClose
        render={
          <Button
            aria-label='Fechar detalhes da cobertura'
            className='absolute top-4 right-4 text-muted-foreground'
            size='icon-sm'
            variant='ghost'
          />
        }
      >
        <Icon name='x' className='size-4' />
      </DialogClose>
      <div className='px-6 pb-6'>
        <dl className='grid grid-cols-2 gap-4 text-sm'>
          <Metric
            label='Vendas cobertas'
            value={
              analytics ? formatCurrency(analytics.margin.coveredNetSalesCents) : '—'
            }
          />
          <Metric
            label='Cobertura'
            value={analytics ? `${analytics.margin.coveragePercentage.toFixed(0)}%` : '—'}
          />
          <Metric
            label='Custo dos produtos vendidos (CMV)'
            value={analytics ? formatCurrency(analytics.margin.cogsCents) : '—'}
          />
          <Metric
            label='Margem estimada'
            value={
              analytics?.margin.grossMarginCents === null
                ? 'Indisponível'
                : analytics
                  ? formatCurrency(analytics.margin.grossMarginCents)
                  : '—'
            }
          />
          <Metric
            label='Vendas sem custo completo'
            value={
              analytics ? formatCurrency(analytics.margin.uncoveredNetSalesCents) : '—'
            }
          />
        </dl>
        {analytics?.margin.affectedProducts.length ? (
          <ul className='mt-5 space-y-2 text-sm'>
            {analytics.margin.affectedProducts.map((product) => (
              <li key={product.name} className='flex justify-between gap-3'>
                {product.currentProductId ? (
                  <Anchor
                    route='productDetails'
                    params={{ productId: product.currentProductId }}
                    className='font-bold text-primary hover:underline'
                  >
                    {product.name}
                  </Anchor>
                ) : (
                  <span>{product.name}</span>
                )}
                <span className='text-warning'>Sem custo completo</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className='mt-5 text-sm text-muted-foreground'>
            Todas as vendas do período possuem cobertura de custos.
          </p>
        )}
        <p className='mt-5 text-xs text-muted-foreground'>
          Esta é uma estimativa de margem bruta com custos operacionais capturados no
          momento da venda. Não representa lucro líquido, resultado contábil ou margem de
          caixa.
        </p>
        {children}
      </div>
    </DialogContent>
  </Dialog>
)

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  )

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className='rounded-lg bg-muted p-3'>
    <dt className='text-xs text-muted-foreground'>{label}</dt>
    <dd className='mt-1 text-lg font-bold'>{value}</dd>
  </div>
)
