import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

import type { EstablishmentSettings } from '@scoops/core/identity/domain/structures'

import { useShopSettingsPage } from '../use-shop-settings-page'

const { actionState, queryState, showErrorToastMock } = vi.hoisted(() => ({
  actionState: {
    actionError: null as Error | null,
    changeEstablishmentName: vi.fn(),
    isPending: false,
  },
  queryState: {
    error: null as Error | null,
    isLoading: false,
    refetch: vi.fn(),
    settings: null as EstablishmentSettings | null,
  },
  showErrorToastMock: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-change-establishment-name-action', () => ({
  useChangeEstablishmentNameAction: () => actionState,
}))
vi.mock('@/ui/identity/hooks/use-establishment-settings-query', () => ({
  useEstablishmentSettingsQuery: () => queryState,
}))
vi.mock('@/ui/shared/notifications', () => ({
  showErrorToast: showErrorToastMock,
}))

describe('useShopSettingsPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    actionState.actionError = null
    actionState.isPending = false
    queryState.error = null
    queryState.isLoading = false
    queryState.settings = {
      establishment: {
        id: 'establishment-id',
        name: 'Scoops Central',
        status: 'active',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      responsibleManager: { id: 'manager-id', name: 'Ana Manager' },
    } as EstablishmentSettings
  })

  it('trims a valid shop name and keeps success feedback after closing the dialog', async () => {
    actionState.changeEstablishmentName.mockResolvedValue(queryState.settings)
    const { result } = renderHook(() => useShopSettingsPage())

    act(() => result.current.handleOpenNameDialog())
    act(() => result.current.handleNameChange('  Scoops Jardins  '))
    await act(async () => {
      await result.current.handleNameSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(actionState.changeEstablishmentName).toHaveBeenCalledWith('Scoops Jardins')
    expect(result.current.isNameDialogOpen).toBe(false)
    expect(result.current.announcement).toBe('Nome da loja atualizado com sucesso.')
  })

  it('rejects an empty shop name without calling the mutation', async () => {
    const { result } = renderHook(() => useShopSettingsPage())

    act(() => result.current.handleOpenNameDialog())
    act(() => result.current.handleNameChange('  '))
    await act(async () => {
      await result.current.handleNameSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(actionState.changeEstablishmentName).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Informe o nome da loja.')
    expect(result.current.isNameDialogOpen).toBe(true)
  })

  it('retains failed shop input and leaves the dialog available for retry', async () => {
    actionState.changeEstablishmentName.mockRejectedValue(new Error('request failed'))
    const { result } = renderHook(() => useShopSettingsPage())

    act(() => result.current.handleOpenNameDialog())
    act(() => result.current.handleNameChange('Name to retry'))
    await act(async () => {
      await result.current.handleNameSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.name).toBe('Name to retry')
    expect(result.current.isNameDialogOpen).toBe(true)
    expect(showErrorToastMock).toHaveBeenCalledWith('request failed')
  })
})
