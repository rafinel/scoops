import { OrderStatus } from '@scoops/core/pdv/domain/structures'

import { useFormatDate } from '@/ui/shared/hooks/use-format-date'

import type { OrderDetailsHeaderProps } from '.'

const DATE_OPTIONS = { dateStyle: 'short', timeStyle: 'short' } as const

export function useOrderDetailsHeader(props: OrderDetailsHeaderProps) {
  const formatDate = useFormatDate()
  return getHeaderDisplay(props, formatDate)
}

function getHeaderDisplay(
  props: OrderDetailsHeaderProps,
  formatDate: ReturnType<typeof useFormatDate>,
) {
  return {
    sequence: getSequence(props.sequenceNumber),
    ...getStatusDisplay(props, formatDate),
    handleBack: props.onBack,
    handleOpenCancel: props.onOpenCancel,
  }
}

function getStatusDisplay(
  props: OrderDetailsHeaderProps,
  formatDate: ReturnType<typeof useFormatDate>,
) {
  const isCanceled = props.status === OrderStatus.Canceled
  return { isCanceled, timestamp: getTimestamp(props, isCanceled, formatDate) }
}

function getSequence(number: number) {
  return String(number).padStart(5, '0')
}

function getTimestamp(
  props: OrderDetailsHeaderProps,
  isCanceled: boolean,
  formatDate: ReturnType<typeof useFormatDate>,
) {
  const date = isCanceled && props.canceledAt ? props.canceledAt : props.createdAt
  return formatDate(date, DATE_OPTIONS)
}
