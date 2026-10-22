import { PortionsEmptyContent } from './portions-empty-content'
import { PortionsSearchEmpty } from './portions-search-empty'

export type PortionsEmptyStateVariant =
  | 'no-link'
  | 'no-portion-registered'
  | 'global-empty'
  | 'search-empty'

export type PortionsEmptyStateProps = {
  canManage: boolean
  inactiveNoticeId?: string
  isActive: boolean
  onClearSearch: () => void
  onLink: () => void
  search?: string
  variant: PortionsEmptyStateVariant
}

export const PortionsEmptyState = ({
  onClearSearch,
  search,
  variant,
  ...contentProps
}: PortionsEmptyStateProps) =>
  variant === 'search-empty' ? (
    <PortionsSearchEmpty onClearSearch={onClearSearch} search={search} />
  ) : (
    <PortionsEmptyContent {...contentProps} variant={variant} />
  )
