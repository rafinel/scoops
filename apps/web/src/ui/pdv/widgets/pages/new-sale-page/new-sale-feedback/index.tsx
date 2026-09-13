import { Alert, AlertDescription, AlertTitle } from '@/ui/shadcn/alert'
import { Button } from '@/ui/shadcn/button'
import { PageRefreshStatus } from '@/ui/pdv/widgets/pages/query-refresh-status'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type NewSaleFeedbackProps = {
  isActiveSalesChannelsError: boolean
  isRefreshingActiveSalesChannels: boolean
  onRefreshPreview: () => void
  onRetryRegistration: () => void
  previewError?: string
  registrationError?: string
}

export const NewSaleFeedback = (props: NewSaleFeedbackProps) => (
  <>
    {props.isActiveSalesChannelsError ? (
      <Alert className='mb-4' variant='destructive'>
        <Icon name='triangle-alert' />
        <AlertTitle>Canais de venda indisponíveis</AlertTitle>
        <AlertDescription>O pedido pode continuar sem canal de venda.</AlertDescription>
      </Alert>
    ) : null}
    {props.previewError ? (
      <Alert className='mb-4' variant='destructive'>
        <Icon name='triangle-alert' />
        <AlertTitle>Não foi possível atualizar os valores</AlertTitle>
        <AlertDescription>
          <span>{props.previewError}</span>{' '}
          <Button
            className='h-auto p-0 font-bold'
            onClick={props.onRefreshPreview}
            type='button'
            variant='link'
          >
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    ) : null}
    {props.registrationError ? (
      <Alert className='mb-4' variant='destructive'>
        <Icon name='triangle-alert' />
        <AlertTitle>Não foi possível registrar o pedido</AlertTitle>
        <AlertDescription>
          <span>{props.registrationError}</span>{' '}
          <Button
            className='h-auto p-0 font-bold'
            onClick={props.onRetryRegistration}
            type='button'
            variant='link'
          >
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    ) : null}
    <PageRefreshStatus
      isRefreshing={props.isRefreshingActiveSalesChannels}
      label='Atualizando canais de venda…'
    />
  </>
)
