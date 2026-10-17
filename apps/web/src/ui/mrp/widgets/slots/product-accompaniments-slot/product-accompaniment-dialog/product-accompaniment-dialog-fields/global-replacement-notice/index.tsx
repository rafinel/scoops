import { Icon } from '@/ui/shared/widgets/components/icon'

export type GlobalReplacementNoticeProps = {
  id: string
  isVisible: boolean
}

export const GlobalReplacementNotice = ({
  id,
  isVisible,
}: GlobalReplacementNoticeProps) =>
  isVisible ? (
    <div
      className='flex items-start gap-2.5 rounded-[10px] bg-warning-soft px-3.5 py-2.5 text-[13px] font-medium text-warning'
      id={id}
      role='status'
    >
      <Icon className='mt-0.5 size-4 shrink-0 text-warning' name='triangle-alert' />
      <span>
        Este acompanhamento já está vinculado individualmente a outras porções. Ao salvar,
        esses vínculos serão substituídos pela configuração global.
      </span>
    </div>
  ) : null
