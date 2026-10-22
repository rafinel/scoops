import { GlobalPageActions } from './global-page-actions'
import { IndividualPageActions } from './individual-page-actions'

export type PortionsPageActionsProps = {
  hasPortionProducts: boolean
  hasRows: boolean
  inactiveNoticeId: string
  isActive: boolean
  isGlobal: boolean
  onEditGlobal: () => void
  onLink: () => void
  onMakeGlobal: () => void
  onMakeIndividual: () => void
  onRemoveGlobal: () => void
}

export const PortionsPageActions = (props: PortionsPageActionsProps) => {
  const describedBy = props.isActive ? undefined : props.inactiveNoticeId

  if (props.isGlobal) return <GlobalPageActions {...props} describedBy={describedBy} />
  if (!props.hasPortionProducts) return null
  return <IndividualPageActions {...props} describedBy={describedBy} />
}
