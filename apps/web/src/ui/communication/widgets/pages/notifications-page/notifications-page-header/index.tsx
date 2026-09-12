import type { MouseEvent } from 'react'

import { BackLink } from '@/ui/shared/widgets/components/back-link'

import {
  NotificationPeriodFilter,
  type NotificationPeriod,
} from '../../../components/notification-period-filter'

export type NotificationsPageHeaderProps = {
  handleBack: (event: MouseEvent<HTMLAnchorElement>) => void
  handlePeriodChange: (period: NotificationPeriod) => void
  period: NotificationPeriod
}

export const NotificationsPageHeader = ({
  handleBack,
  handlePeriodChange,
  period,
}: NotificationsPageHeaderProps) => (
  <header className='flex flex-col gap-4'>
    <div>
      <BackLink
        aria-label='Voltar para página anterior'
        className='-ml-2 mb-3'
        onClick={handleBack}
        route='app'
      >
        Voltar
      </BackLink>
      <h1 className='mt-2 text-[28px] font-extrabold tracking-tight'>Notificações</h1>
      <p className='mt-1 text-sm font-medium text-muted-foreground'>
        Acompanhe alertas e atualizações importantes da sua operação.
      </p>
    </div>
    <NotificationPeriodFilter onChange={handlePeriodChange} period={period} />
  </header>
)
