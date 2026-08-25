import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ProductDangerZoneProps = {
  onRemove: (trigger: HTMLElement) => void
}

export const ProductDangerZone = ({ onRemove }: ProductDangerZoneProps) => (
  <section className='flex flex-col gap-5 rounded-2xl border border-red-300 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
    <div>
      <h2 className='text-lg font-extrabold text-red-800'>Zona de Perigo</h2>
      <p className='mt-1 text-sm text-red-700'>Ações irreversíveis. Faça com cuidado.</p>
    </div>
    <Button
      className='w-full bg-destructive text-white shadow-destructive hover:bg-destructive/90 sm:w-auto'
      onClick={(event) => onRemove(event.currentTarget)}
    >
      <Icon name='trash-2' /> Remover produto
    </Button>
  </section>
)
