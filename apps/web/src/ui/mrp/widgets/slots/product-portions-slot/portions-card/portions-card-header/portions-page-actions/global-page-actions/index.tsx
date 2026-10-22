import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type GlobalPageActionsProps = {
  describedBy?: string
  hasRows: boolean
  isActive: boolean
  onEditGlobal: () => void
  onMakeIndividual: () => void
  onRemoveGlobal: () => void
}

const ACTION_CLASS = 'h-[38px] rounded-[10px] px-5 text-[13px] font-bold'
const DANGER_CLASS =
  '!border-destructive !text-destructive hover:!bg-destructive/5 hover:!text-destructive'

export const GlobalPageActions = (props: GlobalPageActionsProps) => (
  <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end lg:shrink-0 lg:flex-nowrap'>
    <Button
      aria-describedby={props.describedBy}
      className={ACTION_CLASS}
      disabled={!props.isActive}
      onClick={props.onEditGlobal}
      type='button'
      variant='outline'
    >
      <Icon className='size-3.5' name='pencil' /> Editar
    </Button>
    {props.hasRows ? (
      <Button
        className={ACTION_CLASS}
        onClick={props.onMakeIndividual}
        type='button'
        variant='outline'
      >
        <Icon className='size-3.5' name='link' /> Tornar individual
      </Button>
    ) : null}
    <Button
      className={`${ACTION_CLASS} ${DANGER_CLASS}`}
      onClick={props.onRemoveGlobal}
      type='button'
      variant='outline'
    >
      <Icon className='size-3.5' name='trash-2' /> Remover de todas as porções
    </Button>
  </div>
)
