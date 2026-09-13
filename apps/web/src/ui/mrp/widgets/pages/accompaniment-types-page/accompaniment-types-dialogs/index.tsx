import { AccompanimentTypeDialog } from '../accompaniment-type-dialog'
import { RemoveAccompanimentTypeDialog } from '../remove-accompaniment-type-dialog'
import type { AccompanimentTypesAction } from '../use-accompaniment-types-page'

export type AccompanimentTypesDialogsProps = {
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  selectedAction?: AccompanimentTypesAction
}

export const AccompanimentTypesDialogs = ({
  onOpenChange,
  onSuccess,
  selectedAction,
}: AccompanimentTypesDialogsProps) => {
  return (
    <>
      {selectedAction?.kind === 'create' || selectedAction?.kind === 'edit' ? (
        <AccompanimentTypeDialog
          item={selectedAction.kind === 'edit' ? selectedAction.item : undefined}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
          open
        />
      ) : null}
      {selectedAction?.kind === 'remove' ? (
        <RemoveAccompanimentTypeDialog
          item={selectedAction.item}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
          open
        />
      ) : null}
    </>
  )
}
