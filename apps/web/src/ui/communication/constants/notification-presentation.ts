import type { Notification } from '@scoops/core/communication/domain/entities'
import { NotificationKind } from '@scoops/core/communication/domain/structures'

import type { IconName } from '@/ui/shared/widgets/components/icon'

import { NOTIFICATION_SEMANTIC_STYLES } from './notification-semantic-styles'

type NotificationPresentation = {
  icon: IconName
  iconClassName: string
  iconContainerClassName: string
}

export const NOTIFICATION_PRESENTATION: Record<
  Notification['kind'],
  NotificationPresentation
> = {
  [NotificationKind.StockBelowIdeal]: {
    icon: 'package',
    ...NOTIFICATION_SEMANTIC_STYLES.warning,
  },
  [NotificationKind.StockZero]: {
    icon: 'triangle-alert',
    ...NOTIFICATION_SEMANTIC_STYLES.danger,
  },
  [NotificationKind.UserAdded]: {
    icon: 'user-plus',
    ...NOTIFICATION_SEMANTIC_STYLES.primary,
  },
  [NotificationKind.UserPromoted]: {
    icon: 'shield-check',
    ...NOTIFICATION_SEMANTIC_STYLES.success,
  },
  [NotificationKind.UserDemoted]: {
    icon: 'shield',
    ...NOTIFICATION_SEMANTIC_STYLES.warning,
  },
  [NotificationKind.UserInactivated]: {
    icon: 'shield-alert',
    ...NOTIFICATION_SEMANTIC_STYLES.muted,
  },
  [NotificationKind.UserReactivated]: {
    icon: 'user-check',
    ...NOTIFICATION_SEMANTIC_STYLES.success,
  },
}
