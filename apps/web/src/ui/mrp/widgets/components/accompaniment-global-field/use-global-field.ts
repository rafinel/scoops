import { useId } from 'react'

const HELP_TEXT =
  'Aparece em todas as porções, incluindo as novas. Tipo, quantidade e preço são compartilhados.'

export type UseGlobalFieldProps = {
  handleGlobalChange: (checked: boolean) => void
  shouldShowReplacementNotice: boolean
}

export function useGlobalField({
  handleGlobalChange,
  shouldShowReplacementNotice,
}: UseGlobalFieldProps) {
  const baseId = useId()
  const labelId = `${baseId}-label`
  const helpId = `${baseId}-help`
  const replacementNoticeId = `${baseId}-replacement`
  const describedBy = shouldShowReplacementNotice
    ? `${helpId} ${replacementNoticeId}`
    : helpId

  function handleCheckedChange(checked: boolean) {
    handleGlobalChange(checked)
  }

  return {
    describedBy,
    handleCheckedChange,
    helpId,
    helpText: HELP_TEXT,
    labelId,
    replacementNoticeId,
  }
}
