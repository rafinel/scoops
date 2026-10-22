import { Icon } from '@/ui/shared/widgets/components/icon'

export type GlobalScopeNoticeProps = {
  explainsRemoval?: boolean
  isGlobal: boolean
  message?: string
}

export const GlobalScopeNotice = ({
  explainsRemoval = false,
  isGlobal,
  message = 'Acompanhamento global: as alterações valem para todas as porções.',
}: GlobalScopeNoticeProps) =>
  isGlobal ? (
    <div
      className='flex items-start gap-2.5 rounded-[10px] bg-accent px-3.5 py-2.5 text-[13px] font-medium text-foreground'
      role='status'
    >
      <Icon className='mt-0.5 size-4 shrink-0 text-primary' name='globe' />
      <span>
        {message}
        {explainsRemoval ? ' Para deixar de ser global, use Remover na tabela.' : ''}
      </span>
    </div>
  ) : null
