import { useId } from 'react'

const LOCKED_HELP =
  'Aparece em todas as porções, incluindo as novas. Para deixar de ser global, use Remover na tabela.'
const UNLOCKED_HELP =
  'Aparece em todas as porções, incluindo as novas. Tipo, quantidade e preço são compartilhados.'

export type UseGlobalFieldProps = {
  handleGlobalChange: (checked: boolean) => void
  isLocked: boolean
  shouldShowReplacementNotice: boolean
}

export function useGlobalField({
  handleGlobalChange,
  isLocked,
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
    if (isLocked) return
    handleGlobalChange(checked)
  }

  return {
    describedBy,
    handleCheckedChange,
    helpId,
    helpText: isLocked ? LOCKED_HELP : UNLOCKED_HELP,
    labelId,
    replacementNoticeId,
  }
}
