import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrderPrintActionProps = {
  isPrinting: boolean
  isDisabled: boolean
  onPrint: () => void
}

export const OrderPrintAction = ({
  isPrinting,
  isDisabled,
  onPrint,
}: OrderPrintActionProps) => (
  <Button
    aria-busy={isPrinting}
    className='w-full rounded-md bg-card px-3.5 text-[13px] font-bold text-foreground sm:w-auto'
    disabled={isDisabled}
    onClick={onPrint}
    size='lg'
    type='button'
    variant='outline'
  >
    <Icon className='size-3.5' name='printer' /> Imprimir pedido
  </Button>
)
