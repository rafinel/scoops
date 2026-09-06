import type { NotificationsSearch } from '@scoops/validation'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type NotificationPeriod = NotificationsSearch['period']

export const NOTIFICATION_PERIOD_LABELS: Record<NotificationPeriod, string> = {
  'last-7-days': 'Últimos 7 dias',
  'last-30-days': 'Últimos 30 dias',
  'last-90-days': 'Últimos 90 dias',
  all: 'Todo o período',
}

export type NotificationPeriodFilterProps = {
  onChange: (period: NotificationPeriod) => void
  period: NotificationPeriod
}

export const NotificationPeriodFilter = ({
  onChange,
  period,
}: NotificationPeriodFilterProps) => (
  <Select
    value={period}
    onValueChange={(value) => value && onChange(value as NotificationPeriod)}
  >
    <SelectTrigger
      aria-label='Filtrar por período'
      className='h-11 w-full rounded-xl bg-card px-3.5 sm:w-[190px]'
    >
      <Icon className='size-4 text-muted-foreground' name='calendar' />
      <SelectValue>{NOTIFICATION_PERIOD_LABELS[period]}</SelectValue>
    </SelectTrigger>
    <SelectContent>
      {Object.entries(NOTIFICATION_PERIOD_LABELS).map(([value, label]) => (
        <SelectItem key={value} value={value}>
          {label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
