import { useEffect, useState } from 'react'

import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type { OrderStatus } from '@scoops/core/pdv/domain/structures'
import type { OrdersSearch } from '@scoops/validation'

export type OrdersFiltersProps = {
  channels: readonly SalesChannel[]
  isLoadingChannels: boolean
  onClear: () => void
  onSearchChange: (search: OrdersSearch) => void
  search: OrdersSearch
}

export function useOrdersFilters({ onSearchChange, search }: OrdersFiltersProps) {
  const [searchValue, setSearchValue] = useState(search.search)

  useEffect(() => {
    setSearchValue(search.search)
  }, [search.search])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchValue !== search.search) {
        onSearchChange({ ...search, search: searchValue, page: 1 })
      }
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [onSearchChange, search, searchValue])

  function handleChannelChange(value: string | null) {
    if (value === null) return
    onSearchChange({
      ...search,
      channelId: value === 'all' ? undefined : value === 'none' ? 'none' : value,
      page: 1,
    })
  }

  function handleStatusChange(value: string | null) {
    if (value === null) return
    onSearchChange({
      ...search,
      status: value === 'all' ? undefined : (value as OrderStatus),
      page: 1,
    })
  }

  function handlePeriodChange(value: 'custom' | 'last-30-days' | null) {
    if (value === null) return
    if (value === 'last-30-days') {
      onSearchChange({
        search: search.search,
        channelId: search.channelId,
        status: search.status,
        period: 'last-30-days',
        page: 1,
      })
      return
    }

    const today = formatDateOnly(new Date())
    const customSearch = search.period === 'custom' ? search : undefined
    onSearchChange({
      search: search.search,
      channelId: search.channelId,
      status: search.status,
      period: 'custom',
      from: customSearch?.from ?? today,
      to: customSearch?.to ?? today,
      page: 1,
    })
  }

  function handleFromChange(value: string) {
    if (search.period !== 'custom') return
    onSearchChange({ ...search, from: value, to: search.to ?? value, page: 1 })
  }

  function handleToChange(value: string) {
    if (search.period !== 'custom') return
    onSearchChange({ ...search, from: search.from ?? value, to: value, page: 1 })
  }

  return {
    handleChannelChange,
    handleFromChange,
    handlePeriodChange,
    handleStatusChange,
    handleToChange,
    searchValue,
    setSearchValue,
  }
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
