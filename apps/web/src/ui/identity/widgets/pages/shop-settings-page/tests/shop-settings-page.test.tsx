import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

vi.mock('../use-shop-settings-page', () => ({
  useShopSettingsPage: vi.fn(),
}))

import { ShopSettingsPage } from '../index'
import { useShopSettingsPage } from '../use-shop-settings-page'

const useShopSettingsPageMock = vi.mocked(useShopSettingsPage)

function createPageState() {
  return {
    announcement: '',
    error: null,
    feedbackRef: { current: null },
    handleNameDialogOpenChange: vi.fn(),
    handleNameSubmit: vi.fn(),
    handleOpenNameDialog: vi.fn(),
    isLoading: false,
    isNameDialogOpen: false,
    isPending: false,
    isRefreshing: false,
    refetch: vi.fn(),
    register: vi.fn(() => ({})),
    settings: {
      establishment: {
        id: 'establishment-id',
        name: 'Scoops Central',
        status: 'active',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      responsibleManager: { id: 'manager-id', name: 'Ana Manager' },
    },
  }
}

describe('ShopSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useShopSettingsPageMock.mockReturnValue(createPageState() as never)
  })

  afterEach(cleanup)

  it('keeps settings visible while announcing a refresh', () => {
    useShopSettingsPageMock.mockReturnValueOnce({
      ...createPageState(),
      isRefreshing: true,
    } as never)

    render(<ShopSettingsPage />)

    expect(screen.getByRole('status', { name: 'Atualizando…' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Scoops Central' })).not.toBeNull()
  })
})
