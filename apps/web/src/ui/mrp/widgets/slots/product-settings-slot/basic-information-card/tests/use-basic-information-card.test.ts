import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { useUpdateProductSettingsAction } from '@/ui/mrp/hooks/use-update-product-settings-action'

import { useBasicInformationCard } from '../use-basic-information-card'

vi.mock('@/ui/mrp/hooks/use-update-product-settings-action', () => ({
  useUpdateProductSettingsAction: vi.fn(),
}))

const useUpdateProductSettingsActionMock = vi.mocked(useUpdateProductSettingsAction)
const product = ProductFaker.fake({
  name: 'Produto teste',
  idealStock: 12,
  status: 'active',
})
const sameUnitProduct = { ...product, unit: 'g' as const }

describe('useBasicInformationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updatingProductSettingsField: undefined,
      updateProductSettings: vi.fn().mockResolvedValue({
        product: { updatedAt: new Date('2026-02-01T00:00:00.000Z') },
      }),
    } as never)
  })

  it('saves edited name and ideal stock with the current product version', async () => {
    const updateProductSettings = vi.fn().mockResolvedValue({
      product: { updatedAt: new Date('2026-02-01T00:00:00.000Z') },
    })
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updatingProductSettingsField: undefined,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useBasicInformationCard(product, vi.fn()))

    act(() => {
      result.current.handleNameChange('Novo nome')
      result.current.handleIdealStockChange('24,5')
    })
    act(() => {
      result.current.handleNameBlur()
      result.current.handleIdealStockBlur()
    })

    await waitFor(() => expect(updateProductSettings).toHaveBeenCalledTimes(2))
    expect(updateProductSettings).toHaveBeenCalledWith({
      field: 'name',
      input: { name: 'Novo nome', expectedUpdatedAt: product.updatedAt },
    })
    expect(updateProductSettings).toHaveBeenCalledWith({
      field: 'idealStock',
      input: { idealStock: 24.5, expectedUpdatedAt: product.updatedAt },
    })
  })

  it('exposes save errors and reverts a failed field to the product value', async () => {
    const updateProductSettings = vi.fn().mockRejectedValue(new Error('Falha ao salvar'))
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updatingProductSettingsField: undefined,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useBasicInformationCard(product, vi.fn()))

    act(() => result.current.handleNameChange('Nome inválido'))
    act(() => result.current.handleNameBlur())
    await waitFor(() => expect(result.current.errors.name).toBe('Falha ao salvar'))

    act(() => result.current.handleRevert('name'))
    expect(result.current.name).toBe(product.name)
    expect(result.current.errors.name).toBeUndefined()
  })

  it('shows validation errors without saving invalid name and ideal stock values', () => {
    const updateProductSettings = vi.fn()
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updatingProductSettingsField: undefined,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useBasicInformationCard(product, vi.fn()))

    act(() => result.current.handleNameChange(' '))
    act(() => result.current.handleNameBlur())
    act(() => result.current.handleIdealStockChange('-1'))
    act(() => result.current.handleIdealStockBlur())

    expect(result.current.errors.name).toBe('Informe o nome do produto.')
    expect(result.current.errors.idealStock).toBe(
      'Informe um estoque ideal válido, com até três casas decimais.',
    )
    expect(updateProductSettings).not.toHaveBeenCalled()
  })

  it('serializes status saves and carries the returned version to the next save', async () => {
    const firstUpdatedAt = new Date('2026-02-02T00:00:00.000Z')
    const secondUpdatedAt = new Date('2026-02-03T00:00:00.000Z')
    const updateProductSettings = vi
      .fn()
      .mockResolvedValueOnce({ product: { updatedAt: firstUpdatedAt } })
      .mockResolvedValueOnce({ product: { updatedAt: secondUpdatedAt } })
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updatingProductSettingsField: undefined,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useBasicInformationCard(product, vi.fn()))

    act(() => result.current.handleStatusChange('inactive'))
    await waitFor(() => expect(updateProductSettings).toHaveBeenCalledTimes(1))
    act(() => result.current.handleStatusChange('active'))
    await waitFor(() => expect(updateProductSettings).toHaveBeenCalledTimes(2))

    expect(result.current.status).toBe('active')
    expect(updateProductSettings).toHaveBeenNthCalledWith(1, {
      field: 'status',
      input: { status: 'inactive', expectedUpdatedAt: product.updatedAt },
    })
    expect(updateProductSettings).toHaveBeenNthCalledWith(2, {
      field: 'status',
      input: { status: 'active', expectedUpdatedAt: firstUpdatedAt },
    })
  })

  it('retries a failed ideal stock save and clears its error after success', async () => {
    const updateProductSettings = vi
      .fn()
      .mockRejectedValueOnce(new Error('Falha ao salvar'))
      .mockResolvedValueOnce({ product: { updatedAt: product.updatedAt } })
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updatingProductSettingsField: undefined,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useBasicInformationCard(product, vi.fn()))

    act(() => result.current.handleIdealStockChange('24'))
    act(() => result.current.handleIdealStockBlur())
    await waitFor(() => expect(result.current.errors.idealStock).toBe('Falha ao salvar'))

    act(() => result.current.handleRetry('idealStock'))
    await waitFor(() => expect(updateProductSettings).toHaveBeenCalledTimes(2))
    expect(result.current.errors.idealStock).toBeUndefined()
  })

  it('retries and can revert a failed status save', async () => {
    const updateProductSettings = vi
      .fn()
      .mockRejectedValueOnce(new Error('Falha ao salvar'))
      .mockResolvedValueOnce({ product: { updatedAt: product.updatedAt } })
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updatingProductSettingsField: undefined,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useBasicInformationCard(product, vi.fn()))

    act(() => result.current.handleStatusChange('inactive'))
    await waitFor(() => expect(result.current.errors.status).toBe('Falha ao salvar'))

    act(() => result.current.handleRetry('status'))
    await waitFor(() => expect(updateProductSettings).toHaveBeenCalledTimes(2))
    expect(result.current.errors.status).toBeUndefined()
    expect(result.current.status).toBe('inactive')

    act(() => result.current.handleRevert('status'))
    expect(result.current.status).toBe(product.status)
  })

  it('delegates a changed unit with the trigger element', () => {
    const onUnitChange = vi.fn()
    const { result } = renderHook(() =>
      useBasicInformationCard(sameUnitProduct, onUnitChange),
    )
    const trigger = document.createElement('button')
    result.current.unitTriggerRef.current = trigger

    act(() => result.current.handleUnitChange('kg'))

    expect(onUnitChange).toHaveBeenCalledWith('kg', trigger)
  })

  it('does not delegate a unit selection that matches the current unit', () => {
    const onUnitChange = vi.fn()
    const { result } = renderHook(() =>
      useBasicInformationCard(sameUnitProduct, onUnitChange),
    )

    act(() => result.current.handleUnitChange('g'))

    expect(onUnitChange).not.toHaveBeenCalled()
  })
})
