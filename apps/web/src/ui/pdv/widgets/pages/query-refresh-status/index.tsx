import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type PageRefreshStatusProps = {
  isRefreshing: boolean
  label: string
}

export const PageRefreshStatus = (props: PageRefreshStatusProps) => (
  <QueryRefreshStatus isRefreshing={props.isRefreshing} label={props.label} />
)
