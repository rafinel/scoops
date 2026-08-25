import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ProductSettingsErrorProps = {
  onRetry: () => void
}

export const ProductSettingsError = ({ onRetry }: ProductSettingsErrorProps) => (
  <div
    className='rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center'
    role='alert'
  >
    <Icon className='mx-auto size-7 text-destructive' name='triangle-alert' />
    <h2 className='mt-3 text-lg font-extrabold'>
      Não foi possível carregar as configurações
    </h2>
    <p className='mt-1 text-sm text-muted-foreground'>
      Verifique sua conexão e tente novamente.
    </p>
    <Button className='mt-4' onClick={onRetry} variant='outline'>
      Tentar novamente
    </Button>
  </div>
)
