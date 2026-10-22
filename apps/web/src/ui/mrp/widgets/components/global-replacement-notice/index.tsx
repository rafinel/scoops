import { Icon } from '@/ui/shared/widgets/components/icon'

const WORDING = {
  'portion-side': { replacement: 'configuração global', target: 'outras' },
  'accompaniment-side': {
    replacement: 'configuração global (tipo, quantidade e preço)',
    target: 'algumas',
  },
} as const

export type GlobalReplacementNoticeProps = {
  id?: string
  isVisible: boolean
  wording?: keyof typeof WORDING
}

export const GlobalReplacementNotice = ({
  id,
  isVisible,
  wording = 'portion-side',
}: GlobalReplacementNoticeProps) =>
  isVisible ? (
    <div
      className='flex items-start gap-2.5 rounded-[10px] bg-warning-soft px-3.5 py-2.5 text-[13px] font-medium text-warning'
      id={id}
      role='status'
    >
      <Icon className='mt-0.5 size-4 shrink-0 text-warning' name='triangle-alert' />
      <span>
        Este acompanhamento já está vinculado individualmente a {WORDING[wording].target}{' '}
        porções. Ao salvar, esses vínculos serão substituídos pela{' '}
        {WORDING[wording].replacement}.
      </span>
    </div>
  ) : null
