import { Icon } from '@/ui/shared/widgets/components/icon'

export type PortionsInactiveNoticeProps = {
  id: string
}

export const PortionsInactiveNotice = ({ id }: PortionsInactiveNoticeProps) => (
  <div
    className='flex items-center gap-2.5 rounded-[10px] border !border-[color:var(--border-soft)] bg-muted px-3.5 py-2.5 text-[13px] font-medium text-muted-foreground'
    id={id}
    role='status'
  >
    <Icon className='size-4 shrink-0' name='info' />
    <span>Ative o produto para vincular ou editar porções.</span>
  </div>
)
