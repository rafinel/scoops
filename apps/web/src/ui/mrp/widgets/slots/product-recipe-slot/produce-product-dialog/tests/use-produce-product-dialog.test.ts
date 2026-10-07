import { act, renderHook } from '@testing-library/react'
import type { RecipeDetails } from '@scoops/core/mrp/domain/structures'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useProductionPreviewQuery } from '@/ui/mrp/hooks/use-production-preview-query'
import { useRegisterProductionAction } from '@/ui/mrp/hooks/use-register-production-action'
import { useProduceProductDialog } from '../use-produce-product-dialog'

vi.mock('@/ui/mrp/hooks/use-production-preview-query', () => ({
  useProductionPreviewQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-register-production-action', () => ({
  useRegisterProductionAction: vi.fn(),
}))

const useProductionPreviewQueryMock = vi.mocked(useProductionPreviewQuery)
const useRegisterProductionActionMock = vi.mocked(useRegisterProductionAction)
const registerProductionMock = vi.fn()
const analyticsMocks = vi.hoisted(() => ({
  endWorkflow: vi.fn(),
  recordBlock: vi.fn(),
  recordFailure: vi.fn(),
  startAttempt: vi.fn(),
  startWorkflow: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-analytics-context', () => ({
  useAnalyticsContext: vi.fn(() => analyticsMocks),
}))

const recipe: RecipeDetails = {
  id: 'recipe-1',
  yieldQuantity: 10,
  totalCost: 12,
  unitCost: 1.2,
  maximumProducibleQuantity: 30,
  ingredients: [],
}

const produciblePreview = {
  canProduce: true,
  blockReasons: [],
  consumptions: [],
  totalCost: 12,
  currentOutputStock: 0,
  projectedOutputStock: 20,
}

const blockedPreview = {
  ...produciblePreview,
  canProduce: false,
  blockReasons: ['Estoque insuficiente.'],
}

describe('useProduceProductDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    analyticsMocks.startWorkflow.mockReturnValue({ occurrenceId: 'workflow-1' })
    analyticsMocks.startAttempt.mockReturnValue({ attempt: 1 })
    registerProductionMock.mockReset()
    registerProductionMock.mockResolvedValue(undefined)
    useProductionPreviewQueryMock.mockReturnValue({
      data: produciblePreview,
      isFetching: true,
      isRefreshing: true,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
    useRegisterProductionActionMock.mockReturnValue({
      registerProduction: registerProductionMock,
      isPending: false,
    } as never)
  })

  it('exposes the initial batches state and enables the production preview', () => {
    const { result } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )

    expect(result.current).toMatchObject({
      error: null,
      isInputValid: true,
      isPending: false,
      mode: 'batches',
      preview: { data: produciblePreview, isError: false, isPending: false },
      quantity: 10,
      validationError: null,
      value: '1',
    })
    expect(useProductionPreviewQueryMock).toHaveBeenLastCalledWith('product-1', 10, true)
    expect(useRegisterProductionActionMock).toHaveBeenLastCalledWith('product-1')

    act(() => result.current.handleModeChange('batches'))
    expect(result.current.mode).toBe('batches')
    expect(result.current.value).toBe('1')
  })

  it('updates value and converts between batches and quantity modes', () => {
    const { result } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )

    act(() => result.current.handleModeChange('quantity'))
    expect(result.current).toMatchObject({ mode: 'quantity', value: '10', quantity: 10 })

    act(() => result.current.setValue('25'))
    expect(result.current).toMatchObject({ value: '25', quantity: 25 })
    expect(useProductionPreviewQueryMock).toHaveBeenLastCalledWith('product-1', 25, true)

    act(() => result.current.handleModeChange('batches'))
    expect(result.current).toMatchObject({ mode: 'batches', value: '1', quantity: 10 })

    act(() => result.current.handleModeChange('quantity'))
    act(() => result.current.setValue('20'))
    act(() => result.current.handleModeChange('batches'))
    expect(result.current).toMatchObject({ mode: 'batches', value: '2', quantity: 20 })
  })

  it('reports batch and quantity validation messages and disables the preview', () => {
    const { result } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )

    act(() => result.current.setValue('1.5'))
    expect(result.current).toMatchObject({
      isInputValid: false,
      validationError: 'Informe um número inteiro positivo de lotes.',
      value: '1.5',
      quantity: 15,
    })
    expect(useProductionPreviewQueryMock).toHaveBeenLastCalledWith('product-1', 15, false)

    act(() => result.current.handleModeChange('quantity'))
    act(() => result.current.setValue('1.2345'))
    expect(result.current).toMatchObject({
      isInputValid: false,
      validationError: 'Informe uma quantidade positiva com até três casas decimais.',
      value: '1.2345',
      quantity: 1.2345,
    })
    expect(useProductionPreviewQueryMock).toHaveBeenLastCalledWith(
      'product-1',
      1.2345,
      false,
    )

    act(() => result.current.setValue(''))
    expect(result.current).toMatchObject({
      isInputValid: false,
      validationError: 'Informe uma quantidade positiva com até três casas decimais.',
      quantity: 0,
    })
    expect(useProductionPreviewQueryMock).toHaveBeenLastCalledWith('product-1', 0, false)

    act(() => result.current.setValue('not-a-number'))
    expect(result.current).toMatchObject({
      isInputValid: false,
      validationError: 'Informe uma quantidade positiva com até três casas decimais.',
      quantity: Number.NaN,
    })
    expect(useProductionPreviewQueryMock).toHaveBeenLastCalledWith('product-1', 0, false)
  })

  it('registers valid production and reports the success callback', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )

    await act(async () => result.current.handleConfirm(onSuccess))

    expect(registerProductionMock).toHaveBeenCalledWith({ quantity: 10 }, { attempt: 1 })
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeNull()
  })

  it('guards confirmation when the input is invalid', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )
    act(() => result.current.setValue('0'))

    await act(async () => result.current.handleConfirm(onSuccess))

    expect(registerProductionMock).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Informe um número inteiro positivo de lotes.')
    expect(analyticsMocks.recordBlock).toHaveBeenCalledWith({
      workflow: { occurrenceId: 'workflow-1' },
      block: {
        phase: 'validation',
        failureCode: 'invalid_input',
        fields: ['batches'],
      },
    })
  })

  it('does not register production when the preview blocks it', async () => {
    useProductionPreviewQueryMock.mockReturnValue({
      data: blockedPreview,
      isFetching: false,
      isRefreshing: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )

    await act(async () => result.current.handleConfirm(onSuccess))

    expect(result.current.preview.data).toBe(blockedPreview)
    expect(registerProductionMock).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('records a settled preview block after the user changes production input', () => {
    useProductionPreviewQueryMock.mockReturnValue({
      data: blockedPreview,
      isFetching: false,
      isRefreshing: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
    const { result } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )

    act(() => result.current.setValue('2'))

    expect(analyticsMocks.recordBlock).toHaveBeenCalledWith({
      workflow: { occurrenceId: 'workflow-1' },
      block: {
        phase: 'preview',
        failureCode: 'unknown',
        fields: ['batches'],
      },
    })
  })

  it('keeps a preview block episode while the next preview request is pending', () => {
    useProductionPreviewQueryMock.mockReturnValue({
      data: blockedPreview,
      isFetching: false,
      isRefreshing: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
    const { result, rerender } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )

    act(() => result.current.setValue('2'))
    expect(analyticsMocks.recordBlock).toHaveBeenCalledTimes(1)

    useProductionPreviewQueryMock.mockReturnValue({
      data: blockedPreview,
      isFetching: true,
      isRefreshing: true,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
    rerender()

    expect(analyticsMocks.recordBlock).toHaveBeenCalledTimes(1)
    expect(analyticsMocks.recordBlock).not.toHaveBeenLastCalledWith({
      workflow: { occurrenceId: 'workflow-1' },
      block: null,
    })
  })

  it('records preview failures once with an opaque request key', () => {
    const { rerender } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )
    useProductionPreviewQueryMock.mockReturnValue({
      data: undefined,
      isFetching: false,
      isRefreshing: false,
      isPending: false,
      isError: true,
      errorUpdatedAt: 100,
      refetch: vi.fn(),
    } as never)

    rerender()
    rerender()

    expect(analyticsMocks.recordFailure).toHaveBeenCalledTimes(1)
    expect(analyticsMocks.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow: { occurrenceId: 'workflow-1' },
        phase: 'preview',
        failureCode: 'unknown',
        observationKey: expect.any(String),
      }),
    )
    expect(analyticsMocks.recordFailure.mock.calls[0]?.[0]?.observationKey).not.toContain(
      'product-1',
    )
  })

  it('maps structured preview failures without using their message', () => {
    const { rerender } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )
    useProductionPreviewQueryMock.mockReturnValue({
      data: undefined,
      error: new ConflictError('A mensagem é ignorada.'),
      isFetching: false,
      isRefreshing: false,
      isPending: false,
      isError: true,
      errorUpdatedAt: 100,
      refetch: vi.fn(),
    } as never)

    rerender()

    expect(analyticsMocks.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow: { occurrenceId: 'workflow-1' },
        phase: 'preview',
        failureCode: 'conflict',
        statusClass: '4xx',
      }),
    )
  })

  it('starts a distinct occurrence each time the dialog is opened', () => {
    const { rerender } = renderHook(
      ({ open }) => useProduceProductDialog({ open, productId: 'product-1', recipe }),
      { initialProps: { open: false } },
    )

    expect(analyticsMocks.startWorkflow).not.toHaveBeenCalled()
    rerender({ open: true })
    const firstEntryKey = analyticsMocks.startWorkflow.mock.calls[0]?.[0]?.entryKey
    rerender({ open: false })
    rerender({ open: true })
    const secondEntryKey = analyticsMocks.startWorkflow.mock.calls[1]?.[0]?.entryKey

    expect(analyticsMocks.startWorkflow).toHaveBeenCalledTimes(2)
    expect(firstEntryKey).toBeTypeOf('string')
    expect(secondEntryKey).not.toBe(firstEntryKey)
    expect(analyticsMocks.endWorkflow).toHaveBeenCalledWith({
      workflow: { occurrenceId: 'workflow-1' },
    })
  })

  it('maps mutation errors and supports the fallback error message', async () => {
    const { result } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )
    registerProductionMock.mockRejectedValueOnce(new Error('Falha ao registrar.'))

    await act(async () => result.current.handleConfirm(vi.fn()))
    expect(result.current.error).toBe('Falha ao registrar.')

    registerProductionMock.mockRejectedValueOnce('unexpected failure')
    await act(async () => result.current.handleConfirm(vi.fn()))
    expect(result.current.error).toBe('Não foi possível registrar a produção.')
  })

  it('exposes the pending mutation state', () => {
    useRegisterProductionActionMock.mockReturnValue({
      registerProduction: registerProductionMock,
      isPending: true,
    } as never)

    const { result } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )

    expect(result.current.isPending).toBe(true)
  })

  it('resets mode, value, and error whenever the dialog opens', async () => {
    const { result, rerender } = renderHook(
      ({ open }) => useProduceProductDialog({ open, productId: 'product-1', recipe }),
      { initialProps: { open: false } },
    )

    act(() => result.current.handleModeChange('quantity'))
    act(() => result.current.setValue('0'))
    await act(async () => result.current.handleConfirm(vi.fn()))
    expect(result.current.error).toBe(
      'Informe uma quantidade positiva com até três casas decimais.',
    )

    rerender({ open: true })

    expect(result.current).toMatchObject({
      error: null,
      mode: 'batches',
      quantity: 10,
      validationError: null,
      value: '1',
    })
  })
})
