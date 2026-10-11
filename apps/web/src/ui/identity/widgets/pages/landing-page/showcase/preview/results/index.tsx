import { Icon } from '@/ui/shared/widgets/components/icon'

import { PreviewMetric } from '../metric'

export type ResultsPreviewProps = { activeIndex: number }

const SALES_DAYS = [
  { label: 'Seg', amount: 'R$ 700,00', height: 'h-14' },
  { label: 'Ter', amount: 'R$ 850,00', height: 'h-16' },
  { label: 'Qua', amount: 'R$ 800,00', height: 'h-16' },
  { label: 'Qui', amount: 'R$ 1.000,00', height: 'h-20' },
  { label: 'Sex', amount: 'R$ 1.200,00', height: 'h-24' },
  { label: 'Sáb', amount: 'R$ 1.550,00', height: 'h-32' },
  { label: 'Dom', amount: 'R$ 1.400,00', height: 'h-28' },
]

const STOCK_ALERTS = [
  {
    name: 'Água 500 ml',
    current: '0 un',
    detail: 'Sem estoque',
    icon: 'package' as const,
  },
  {
    name: 'Granola',
    current: '800 g',
    detail: 'Abaixo do ideal de 2.000 g',
    icon: 'triangle-alert' as const,
  },
  {
    name: 'Açaí',
    current: '2.500 ml',
    detail: 'Capacidade limitada pela polpa',
    icon: 'chef-hat' as const,
  },
]

export const ResultsPreview = ({ activeIndex }: ResultsPreviewProps) => (
  <div>
    <div className='mb-5 flex items-center justify-between'>
      <div>
        <p className='text-xs text-muted-foreground'>Visão geral</p>
        <h3 className='mt-1 text-2xl font-extrabold tracking-tight'>Dashboard</h3>
      </div>
      <span className='rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold'>
        {activeIndex === 2 ? 'Estoque atual' : 'Últimos 7 dias'}
      </span>
    </div>
    {activeIndex === 0 && (
      <>
        <div className='mb-4 grid grid-cols-3 gap-3'>
          <PreviewMetric
            label='Vendas líquidas'
            value='R$ 7.500,00'
            detail='Valor dos pedidos registrados'
          />
          <PreviewMetric
            label='Pedidos válidos'
            value='300'
            detail='No período selecionado'
          />
          <PreviewMetric
            label='Ticket médio'
            value='R$ 25,00'
            detail='Vendas ÷ pedidos válidos'
          />
        </div>
        <div className='rounded-2xl border border-border bg-card p-5'>
          <p className='mb-4 text-sm font-extrabold'>Evolução das vendas</p>
          <div className='flex h-44 items-end justify-between gap-3 border-b border-border px-3 pb-3'>
            {SALES_DAYS.map((day) => (
              <div key={day.label} className='flex flex-1 flex-col items-center gap-2'>
                <span className='whitespace-nowrap text-[10px] font-semibold text-muted-foreground'>
                  {day.amount}
                </span>
                <span
                  className={`w-full max-w-10 rounded-t-lg bg-primary/80 ${day.height}`}
                />
                <span className='text-xs text-muted-foreground'>{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    )}
    {activeIndex === 1 && (
      <>
        <div className='mb-4 grid grid-cols-2 gap-3'>
          <PreviewMetric
            label='Margem bruta estimada'
            value='R$ 3.600,00'
            detail='60% de margem sobre vendas cobertas'
          />
          <PreviewMetric
            label='Cobertura de custos'
            value='80%'
            detail='R$ 6.000,00 de R$ 7.500,00 em vendas'
          />
        </div>
        <div className='rounded-2xl border border-border bg-card p-5'>
          <p className='mb-4 text-sm font-extrabold'>Como a estimativa é calculada</p>
          <dl className='space-y-4 text-sm'>
            <div className='flex justify-between'>
              <dt className='text-muted-foreground'>Vendas com custo completo</dt>
              <dd className='font-bold'>R$ 6.000,00</dd>
            </div>
            <div className='flex justify-between'>
              <dt className='text-muted-foreground'>Custo dos itens vendidos</dt>
              <dd className='font-bold'>− R$ 2.400,00</dd>
            </div>
            <div className='flex justify-between border-t border-border pt-4'>
              <dt className='font-bold'>Margem bruta estimada</dt>
              <dd className='font-extrabold'>R$ 3.600,00</dd>
            </div>
          </dl>
          <p className='mt-5 flex items-start gap-2 rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground'>
            <Icon name='info' className='size-4 shrink-0 text-primary' />
            R$ 1.500,00 em vendas sem custo completo ficam fora da estimativa. Não
            representa lucro líquido.
          </p>
        </div>
      </>
    )}
    {activeIndex === 2 && (
      <div className='rounded-2xl border border-border bg-card p-5'>
        <div className='mb-5 flex items-center justify-between'>
          <p className='text-sm font-extrabold'>Estoque agora</p>
          <span className='text-xs text-muted-foreground'>3 produtos em atenção</span>
        </div>
        <ul className='divide-y divide-border'>
          {STOCK_ALERTS.map((product) => (
            <li key={product.name} className='flex items-center gap-4 py-5'>
              <span className='rounded-xl bg-muted p-3'>
                <Icon name={product.icon} className='size-5 text-primary' />
              </span>
              <div className='flex-1'>
                <p className='text-sm font-extrabold'>{product.name}</p>
                <p className='mt-1 text-xs text-muted-foreground'>{product.detail}</p>
              </div>
              <span className='text-lg font-extrabold tabular-nums'>
                {product.current}
              </span>
            </li>
          ))}
        </ul>
        <p className='mt-4 text-xs text-muted-foreground'>
          O estoque mostra a situação atual, independente do período das vendas.
        </p>
      </div>
    )}
  </div>
)
