import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SalesChannelsList } from '..'
import { useSalesChannelsList } from '../use-sales-channels-list'

import { makeSalesChannel } from '../../tests/sales-channel-test-fixtures'

vi.mock('../use-sales-channels-list', () => ({
  useSalesChannelsList: vi.fn(),
}))

const channels = [
  makeSalesChannel({ id: 'positive', name: 'Delivery próprio', percentage: 12 }),
  makeSalesChannel({
    id: 'negative',
    name: 'Promoção local',
    percentage: -10,
    status: 'inactive',
  }),
  makeSalesChannel({ id: 'neutral', name: 'Balcão', percentage: 0 }),
]

describe('SalesChannelsList', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.mocked(useSalesChannelsList).mockReturnValue({
      filteredChannels: channels,
    })
  })

  it('shows exact adjustments, semantic statuses and responsive card content', () => {
    render(
      <SalesChannelsList
        adjustmentFilter={undefined}
        channels={channels}
        onAdjustmentFilterChange={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onInactivate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    )

    expect(screen.getAllByText('+12,00%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('−10,00%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Inativo').length).toBeGreaterThan(0)
    expect(screen.getByText('3 canais · 2 ativos · 1 inativo')).toBeTruthy()
  })

  it('exposes edit and lifecycle actions through keyboard-accessible menu items', () => {
    const onEdit = vi.fn()
    const onInactivate = vi.fn()
    render(
      <SalesChannelsList
        adjustmentFilter={undefined}
        channels={[channels[0]]}
        onAdjustmentFilterChange={vi.fn()}
        onDelete={vi.fn()}
        onEdit={onEdit}
        onInactivate={onInactivate}
        onReactivate={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Abrir ações de Delivery próprio' })[0],
    )
    fireEvent.click(screen.getByRole('menuitem', { name: 'Editar canal' }))
    expect(onEdit).toHaveBeenCalledWith(channels[0])
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Abrir ações de Delivery próprio' })[0],
    )
    fireEvent.click(screen.getByRole('menuitem', { name: 'Inativar canal' }))
    expect(onInactivate).toHaveBeenCalledWith(channels[0])
  })

  it('exposes selected adjustment filters and a filtered empty-state recovery action', () => {
    const onAdjustmentFilterChange = vi.fn()
    vi.mocked(useSalesChannelsList).mockReturnValue({
      filteredChannels: [],
    })

    render(
      <SalesChannelsList
        adjustmentFilter='discount'
        channels={channels}
        onAdjustmentFilterChange={onAdjustmentFilterChange}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onInactivate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    )

    expect(
      screen
        .getByRole('button', { name: 'Filtrar descontos' })
        .getAttribute('aria-pressed'),
    ).toBe('true')
    expect(screen.getByRole('status').textContent).toContain(
      'Nenhum canal corresponde a este filtro.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtro' }))
    expect(onAdjustmentFilterChange).toHaveBeenCalledWith(undefined)
  })
})
