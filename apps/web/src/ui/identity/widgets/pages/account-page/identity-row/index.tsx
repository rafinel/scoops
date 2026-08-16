import { Icon } from '@/ui/shared/widgets/components/icon'

export type IdentityRowProps = {
  icon: 'mail' | 'shield' | 'store'
  label: string
  value: string
  readOnly?: boolean
}

export const IdentityRow = ({
  icon,
  label,
  value,
  readOnly = false,
}: IdentityRowProps) => {
  return (
    <li className='flex items-center gap-3 border-b border-border-soft py-4 last:border-b-0'>
      <span className='grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground'>
        <Icon name={icon} className='size-[18px]' />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='text-xs font-semibold text-muted-foreground'>{label}</p>
        <p className='mt-0.5 truncate text-sm font-extrabold'>{value}</p>
      </div>
      {readOnly ? (
        <span className='flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
          <Icon name='lock' className='size-3.5' />
          <span className='hidden sm:inline'>Somente leitura</span>
        </span>
      ) : null}
    </li>
  )
}
