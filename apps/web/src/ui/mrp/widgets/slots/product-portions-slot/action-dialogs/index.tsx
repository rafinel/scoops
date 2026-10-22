import type { GlobalAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { LinkPortionsDialog } from '../link-portions-dialog'
import type { ProductPortionsAction } from '../use-product-portions-slot'
import { GlobalActionDialog } from './global-action-dialog'
import { RowActionDialog } from './row-action-dialog'

export type PortionActionDialogsProps = {
  globalAccompaniment: GlobalAccompanimentDetails
  linkedCount: number
  onBecameGlobal: () => void
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  productId: string
  selectedAction?: ProductPortionsAction
}

export const PortionActionDialogs = ({
  selectedAction,
  ...props
}: PortionActionDialogsProps) => {
  if (!selectedAction) return null
  if (selectedAction.kind === 'link') {
    return (
      <LinkPortionsDialog
        onBecameGlobal={props.onBecameGlobal}
        onOpenChange={props.onOpenChange}
        onSuccess={props.onSuccess}
        open
        productId={props.productId}
      />
    )
  }
  if (selectedAction.kind === 'edit-row' || selectedAction.kind === 'remove-row') {
    return (
      <RowActionDialog {...props} item={selectedAction.item} kind={selectedAction.kind} />
    )
  }
  return <GlobalActionDialog {...props} kind={selectedAction.kind} />
}
