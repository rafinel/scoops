import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/constants'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

export type CategoryGuidanceDialogProps = {
  onOpenChange: (open: boolean) => void
  open: boolean
}

const CATEGORIES: {
  category: ProductCategory
  description: string
  label: string
}[] = [
  {
    category: 'ingredient',
    label: 'Ingrediente',
    description:
      'Insumo usado nas receitas. O custo atual e o saldo ajudam a calcular o custo e quanto pode ser produzido.',
  },
  {
    category: 'manufacturable',
    label: 'Fabricável',
    description:
      'Produto preparado a partir de uma receita. Sozinho, não fica disponível para venda.',
  },
  {
    category: 'portion',
    label: 'Porção',
    description:
      'Permite vender parte do estoque em tamanhos definidos, como 300 g. Precisa de um tamanho ativo para aparecer no PDV.',
  },
  {
    category: 'accompaniment',
    label: 'Acompanhamento',
    description:
      'Pode ser ligado a uma porção, com quantidade consumida por unidade vendida. A oferta é opcional.',
  },
  {
    category: 'resale',
    label: 'Revenda',
    description:
      'Venda do produto como pacote inteiro. Preço e disponibilidade são configurados no produto ou por marca.',
  },
]

export const CategoryGuidanceDialog = ({
  onOpenChange,
  open,
}: CategoryGuidanceDialogProps) => (
  <Dialog onOpenChange={onOpenChange} open={open}>
    <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl'>
      <DialogHeader className='grid-cols-[44px_minmax(0,1fr)] gap-x-3.5 gap-y-1.5 px-6 pt-6 pr-16 pb-5'>
        <span className='row-span-2 flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary'>
          <Icon className='size-5' name='info' />
        </span>
        <DialogTitle className='text-xl font-extrabold leading-tight'>
          Entenda as categorias
        </DialogTitle>
        <DialogDescription className='text-sm leading-5'>
          Escolha as categorias que descrevem o papel deste produto.
        </DialogDescription>
      </DialogHeader>

      <div className='border-t border-border-soft px-6 pt-3 pb-4'>
        <ul className='flex flex-col'>
          {CATEGORIES.map(({ category, description, label }) => (
            <li
              className='flex gap-3 border-b border-border-soft py-2 last:border-b-0'
              key={category}
            >
              <Icon
                className={`mt-0.5 size-5 shrink-0 ${CATEGORY_COLORS[category]}`}
                name={CATEGORY_ICONS[category]}
              />
              <div className='min-w-0'>
                <h3 className='text-sm font-extrabold leading-5 text-foreground'>
                  {label}
                </h3>
                <p className='text-xs font-medium leading-5 text-muted-foreground'>
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className='mt-1 flex gap-2.5 rounded-xl bg-primary-soft px-3.5 py-3 text-primary'>
          <Icon className='mt-0.5 size-4 shrink-0' name='info' />
          <p className='text-xs font-semibold leading-5'>
            Porção e Revenda não podem ser selecionadas juntas. Fabricável pode ser
            combinado com Porção; Acompanhamento pode combinar com Porção ou Revenda.
          </p>
        </div>
      </div>

      <DialogFooter className='flex-row justify-end border-t-0 bg-transparent px-6 pt-3 pb-6'>
        <DialogClose render={<Button className='shadow-primary' color='primary' />}>
          Entendi
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
