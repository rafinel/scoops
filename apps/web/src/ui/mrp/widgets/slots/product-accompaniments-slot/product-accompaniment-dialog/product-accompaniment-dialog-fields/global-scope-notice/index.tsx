import { Icon } from '@/ui/shared/widgets/components/icon'

export type GlobalScopeNoticeProps = {
  isGlobal: boolean
}

export const GlobalScopeNotice = ({ isGlobal }: GlobalScopeNoticeProps) =>
  isGlobal ? (
    <div
      className='flex items-start gap-2.5 rounded-[10px] bg-accent px-3.5 py-2.5 text-[13px] font-medium text-foreground'
      role='status'
    >
      <Icon className='mt-0.5 size-4 shrink-0 text-primary' name='globe' />
      <span>Acompanhamento global: as alterações valem para todas as porções.</span>
    </div>
  ) : null
