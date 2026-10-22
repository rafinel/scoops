import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { type UsePortionsCardProps, usePortionsCard } from '../use-portions-card'

type CardOverrides = {
  canManage?: boolean
  hasPortionProducts?: boolean
  isActive?: boolean
  isGlobal?: boolean
  isSearching?: boolean
  itemsCount?: number
  linkedCount?: number
  search?: string
}

function renderCard({
  canManage = true,
  hasPortionProducts = true,
  isActive = true,
  isGlobal = false,
  isSearching = false,
  itemsCount = 3,
  linkedCount = 23,
  search = '',
}: CardOverrides = {}) {
  const props: UsePortionsCardProps = {
    canManage,
    globalAccompaniment: {
      accompanimentProductId: 'accompaniment-1',
      accompanimentProductName: 'Granola',
      isGlobal,
      unit: 'g',
      salePrice: 3,
    },
    handleSearchChange: vi.fn(),
    isActive,
    isSearching,
    linkedCount,
    portionsPage: {
      items: Array.from({ length: itemsCount }, () => ({}) as never),
      page: 1,
      pageSize: 10,
      total: linkedCount,
      totalPages: 3,
      hasPortionProducts,
    },
    searchInput: search,
  }
  return { ...renderHook(() => usePortionsCard(props)), props }
}

describe('usePortionsCard', () => {
  it('shows the table, the count and the price subtitle for an individual Accompaniment with rows', () => {
    const { result } = renderCard()

    expect(result.current.body).toBe('table')
    expect(result.current.countLabel).toBe('(23)')
    expect(result.current.subtitle).toBe(
      'Porções que oferecem este acompanhamento no PDV. Cada vínculo tem o seu preço.',
    )
    expect(result.current.hasRows).toBe(true)
    expect(result.current.showsSearch).toBe(true)
    expect(result.current.showsPageActions).toBe(true)
    expect(result.current.showsInactiveNotice).toBe(false)
  })

  it('shows the global subtitle without a count for a global Accompaniment', () => {
    const { result } = renderCard({ isGlobal: true })

    expect(result.current.countLabel).toBeUndefined()
    expect(result.current.subtitle).toBe(
      'Este acompanhamento é global e aparece em todas as porções. Tipo, quantidade e preço são compartilhados.',
    )
  })

  it.each([
    [{ itemsCount: 0, linkedCount: 0 }, 'no-link'],
    [
      { itemsCount: 0, linkedCount: 0, hasPortionProducts: false },
      'no-portion-registered',
    ],
    [{ itemsCount: 0, linkedCount: 0, isGlobal: true }, 'global-empty'],
    [{ itemsCount: 0, linkedCount: 23, isSearching: true, search: 'x' }, 'search-empty'],
    [
      { itemsCount: 0, linkedCount: 0, isGlobal: true, isSearching: true },
      'search-empty',
    ],
  ] as const)('selects the %j body %s', (overrides, body) => {
    const { result } = renderCard(overrides)

    expect(result.current.body).toBe(body)
  })

  it('uses the short subtitle and hides rows and the search input when nothing is linked', () => {
    const { result } = renderCard({ itemsCount: 0, linkedCount: 0 })

    expect(result.current.subtitle).toBe(
      'Porções que oferecem este acompanhamento no PDV.',
    )
    expect(result.current.countLabel).toBe('(0)')
    expect(result.current.hasRows).toBe(false)
    expect(result.current.showsSearch).toBe(false)
  })

  it('keeps the search input visible while a search is typed even without results', () => {
    const { result } = renderCard({
      isSearching: true,
      itemsCount: 0,
      search: 'pistache',
    })

    expect(result.current.showsSearch).toBe(true)
    expect(result.current.body).toBe('search-empty')
  })

  it('hides the actions for Operators and shows the inactive notice only to Managers', () => {
    expect(renderCard({ canManage: false }).result.current.showsPageActions).toBe(false)
    expect(
      renderCard({ canManage: false, isActive: false }).result.current
        .showsInactiveNotice,
    ).toBe(false)
    expect(renderCard({ isActive: false }).result.current.showsInactiveNotice).toBe(true)
  })

  it('exposes the global and Portion-registration flags for the header', () => {
    expect(renderCard({ isGlobal: true }).result.current.isGlobal).toBe(true)
    expect(renderCard().result.current.hasPortionProducts).toBe(true)
    expect(
      renderCard({ hasPortionProducts: false, itemsCount: 0 }).result.current
        .hasPortionProducts,
    ).toBe(false)
  })

  it('exposes one stable notice id for the disabled controls', () => {
    const { result, rerender } = renderCard()
    const noticeId = result.current.inactiveNoticeId

    rerender()

    expect(noticeId).not.toBe('')
    expect(result.current.inactiveNoticeId).toBe(noticeId)
  })

  it('clears the search and moves focus to the search input', () => {
    const { result, props } = renderCard()
    const input = document.createElement('input')
    document.body.append(input)
    result.current.searchInputRef.current = input

    act(() => result.current.handleClearSearch())

    expect(props.handleSearchChange).toHaveBeenCalledWith('')
    expect(document.activeElement).toBe(input)
    input.remove()
  })

  it('clears the search even when the input is not mounted', () => {
    const { result, props } = renderCard()

    act(() => result.current.handleClearSearch())

    expect(props.handleSearchChange).toHaveBeenCalledWith('')
  })
})
