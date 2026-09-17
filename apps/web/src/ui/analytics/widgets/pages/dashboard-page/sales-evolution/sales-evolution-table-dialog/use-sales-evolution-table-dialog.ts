export type SalesEvolutionTableDialogControllerProps = {
  onOpenChange: (open: boolean) => void
}

export function useSalesEvolutionTableDialog({
  onOpenChange,
}: SalesEvolutionTableDialogControllerProps) {
  function handleOpenChange(open: boolean) {
    onOpenChange(open)
  }

  return { handleOpenChange }
}
