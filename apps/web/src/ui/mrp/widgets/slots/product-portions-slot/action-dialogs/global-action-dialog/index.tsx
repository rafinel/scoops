import type { GlobalAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { ProductAccompanimentDialog } from '@/ui/mrp/widgets/components/product-accompaniment-dialog'
import { RemoveGlobalAccompanimentDialog } from '@/ui/mrp/widgets/components/remove-global-accompaniment-dialog'

import { MakeIndividualDialog } from '../../make-individual-dialog'

export type GlobalActionDialogProps = {
  globalAccompaniment: GlobalAccompanimentDetails
  kind: 'make-global' | 'edit-global' | 'remove-global' | 'make-individual'
  onOpenChange: (open: boolean) => void
  linkedCount: number
  onSuccess: () => void
  productId: string
}

export const GlobalActionDialog = (props: GlobalActionDialogProps) => {
  const { globalAccompaniment, kind, linkedCount, onOpenChange, onSuccess } = props
  const shared = { onOpenChange, onSuccess, open: true, productId: props.productId }
  const name = globalAccompaniment.accompanimentProductName

  if (kind === 'make-individual') {
    return <MakeIndividualDialog accompanimentName={name} {...shared} />
  }
  if (kind === 'remove-global') {
    return (
      <RemoveGlobalAccompanimentDialog
        accompanimentName={name}
        isScopeLocked
        {...shared}
      />
    )
  }
  return (
    <ProductAccompanimentDialog
      accompaniment={globalAccompaniment}
      hasIndividualLinks={
        kind === 'make-global'
          ? !globalAccompaniment.isGlobal && linkedCount > 0
          : undefined
      }
      mode={kind === 'make-global' ? 'make-global' : 'global'}
      {...shared}
    />
  )
}
