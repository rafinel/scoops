import { PageRefreshStatus } from '@/ui/pdv/widgets/pages/query-refresh-status'

export type SalesChannelsFeedbackProps = {
  actionError: string | null
  announcement: string
  isRefreshing: boolean
}

export const SalesChannelsFeedback = (props: SalesChannelsFeedbackProps) => (
  <>
    {props.actionError ? (
      <p
        aria-live='assertive'
        className='rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm font-semibold text-destructive'
        role='alert'
      >
        {props.actionError}
      </p>
    ) : null}
    <div aria-live='polite' className='sr-only' role='status'>
      {props.announcement}
    </div>
    <PageRefreshStatus
      isRefreshing={props.isRefreshing}
      label='Atualizando canais de venda…'
    />
  </>
)
