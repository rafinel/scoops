import type { EstablishmentTimezone } from '@scoops/core/identity/domain/structures'
import { EstablishmentTimezone as Timezones } from '@scoops/core/identity/domain/structures'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useTimezoneDialog } from './use-timezone-dialog'

const TIMEZONE_LABELS: Record<EstablishmentTimezone, string> = {
  [Timezones.Noronha]: 'Fernando de Noronha (UTC−02:00)',
  [Timezones.Belem]: 'Belém (UTC−03:00)',
  [Timezones.Fortaleza]: 'Fortaleza (UTC−03:00)',
  [Timezones.Recife]: 'Recife (UTC−03:00)',
  [Timezones.Araguaina]: 'Araguaína (UTC−03:00)',
  [Timezones.Maceio]: 'Maceió (UTC−03:00)',
  [Timezones.Bahia]: 'Bahia (UTC−03:00)',
  [Timezones.SaoPaulo]: 'São Paulo (UTC−03:00)',
  [Timezones.CampoGrande]: 'Campo Grande (UTC−04:00)',
  [Timezones.Cuiaba]: 'Cuiabá (UTC−04:00)',
  [Timezones.Santarem]: 'Santarém (UTC−03:00)',
  [Timezones.PortoVelho]: 'Porto Velho (UTC−04:00)',
  [Timezones.BoaVista]: 'Boa Vista (UTC−04:00)',
  [Timezones.Manaus]: 'Manaus (UTC−04:00)',
  [Timezones.Eirunepe]: 'Eirunepé (UTC−05:00)',
  [Timezones.RioBranco]: 'Rio Branco (UTC−05:00)',
}

export const TimezoneDialog = ({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isPending,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: EstablishmentTimezone
  onSubmit: (timeZone: EstablishmentTimezone) => void
  isPending: boolean
  error?: string | null
}) => {
  const { timeZone, setTimeZone } = useTimezoneDialog(initial)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
            <Icon name='clock' className='size-5' />
          </span>
          <div className='min-w-0'>
            <DialogTitle>Alterar fuso horário</DialogTitle>
            <DialogDescription className='mt-1'>
              O horário comercial define os limites dos períodos do Dashboard.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className='grid gap-4 p-6'>
          <Label className='grid gap-2 text-xs font-extrabold'>
            Fuso horário comercial
            <Select
              value={timeZone}
              onValueChange={(value) => setTimeZone(value as EstablishmentTimezone)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue>{TIMEZONE_LABELS[timeZone]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.values(Timezones).map((value) => (
                  <SelectItem key={value} value={value}>
                    {TIMEZONE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <p className='text-xs text-muted-foreground'>Valor técnico: {timeZone}</p>
          {error ? (
            <p className='text-sm font-semibold text-danger' role='alert'>
              {error}
            </p>
          ) : null}
          <DialogFooter className='-mx-6 -mb-6 bg-card p-4 sm:flex-row sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              className='h-10 rounded-lg px-5 font-bold'
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              className='h-10 rounded-lg px-5 font-bold shadow-primary'
              disabled={isPending}
              onClick={() => onSubmit(timeZone)}
            >
              <Icon name='check' className='size-4' />
              {isPending ? 'Salvando…' : 'Salvar alteração'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
