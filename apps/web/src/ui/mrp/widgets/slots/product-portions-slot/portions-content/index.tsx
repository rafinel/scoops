import { GlobalScopeNotice } from '@/ui/mrp/widgets/components/global-scope-notice'

import type { useProductPortionsSlot } from '../use-product-portions-slot'
import { PortionActionDialogs } from '../action-dialogs'
import { PortionsCard } from '../portions-card'

const BECAME_GLOBAL_MESSAGE =
  'Este acompanhamento agora é global. A lista foi atualizada.'

type SlotState = ReturnType<typeof useProductPortionsSlot>

export type PortionsContentProps = Omit<
  SlotState,
  | 'handleBack'
  | 'handleRetry'
  | 'isError'
  | 'isLoading'
  | 'isRefreshing'
  | 'isUnsupported'
  | 'product'
> & { productId: string }

export const PortionsContent = ({
  globalAccompaniment,
  portionsPage,
  ...props
}: PortionsContentProps) => {
  if (!portionsPage || !globalAccompaniment) return null

  return (
    <>
      <GlobalScopeNotice
        isGlobal={props.hasBecomeGlobalNotice}
        message={BECAME_GLOBAL_MESSAGE}
      />
      <PortionsCard
        {...props}
        globalAccompaniment={globalAccompaniment}
        portionsPage={portionsPage}
      />
      {props.canManage ? (
        <PortionActionDialogs
          {...props}
          globalAccompaniment={globalAccompaniment}
          onBecameGlobal={props.handleBecameGlobal}
          onOpenChange={props.handleActionOpenChange}
          onSuccess={props.handleActionSuccess}
        />
      ) : null}
    </>
  )
}
