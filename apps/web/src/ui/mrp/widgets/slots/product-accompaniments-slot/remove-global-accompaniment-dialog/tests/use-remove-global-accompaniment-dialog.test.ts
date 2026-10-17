import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRemoveProductAccompanimentAction } from '@/ui/mrp/hooks/use-remove-product-accompaniment-action'

import {
  type UseRemoveGlobalAccompanimentDialogProps,
  useRemoveGlobalAccompanimentDialog,
} from '../use-remove-global-accompaniment-dialog'

vi.mock('@/ui/mrp/hooks/use-remove-product-accompaniment-action', () => ({
  useRemoveProductAccompanimentAction: vi.fn(),
}))

const useRemoveProductAccompanimentActionMock = vi.mocked(
  useRemoveProductAccompanimentAction,
)

const createProps = (
  overrides: Partial<UseRemoveGlobalAccompanimentDialogProps> = {},
): UseRemoveGlobalAccompanimentDialogProps => ({
  itemId: 'link-1',
  itemName: 'Granola',
  onSuccess: vi.fn(),
  open: true,
  portionName: 'Polpa de Açaí',
  productId: 'product-1',
  ...overrides,
})

describe('useRemoveGlobalAccompanimentDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useRemoveProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeProductAccompaniment: vi.fn().mockResolvedValue(undefined),
    } as never)
  })

  it('starts with the Portion-only scope, its copy and the Portion action', () => {
    const { result } = renderHook(() => useRemoveGlobalAccompanimentDialog(createProps()))

    expect(result.current.removeAll).toBe(false)
    expect(result.current.actionError).toBeNull()
    expect(result.current.isPending).toBe(false)
    expect(result.current.actionLabel).toBe('Remover desta porção')
    expect(result.current.helpText).toBe('Desligado: remove apenas de Polpa de Açaí.')
    expect(result.current.consequence).toBe(
      'Granola continua nas outras porções e nas novas. Você pode vinculá-lo de novo a esta porção depois. Os saldos de estoque não mudam.',
    )
  })

  it('falls back to a generic Portion reference when the Portion name is unknown', () => {
    const { result } = renderHook(() =>
      useRemoveGlobalAccompanimentDialog(createProps({ portionName: undefined })),
    )

    expect(result.current.helpText).toBe('Desligado: remove apenas desta porção.')
  })

  it('switches copy and action label when removing from all Portions', () => {
    const { result } = renderHook(() => useRemoveGlobalAccompanimentDialog(createProps()))

    act(() => result.current.handleRemoveAllChange(true))

    expect(result.current.removeAll).toBe(true)
    expect(result.current.actionLabel).toBe('Remover de todas')
    expect(result.current.helpText).toBe('Granola deixa de ser global.')
    expect(result.current.consequence).toBe(
      'Será removido de todas as porções, incluindo esta. Novas porções não o receberão. Os saldos de estoque não mudam.',
    )
  })

  it('removes only this Portion with the portion scope when the switch is off', async () => {
    const removeProductAccompaniment = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    useRemoveProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeProductAccompaniment,
    } as never)
    const { result } = renderHook(() =>
      useRemoveGlobalAccompanimentDialog(createProps({ onSuccess })),
    )

    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(useRemoveProductAccompanimentActionMock).toHaveBeenCalledWith('product-1')
    expect(removeProductAccompaniment).toHaveBeenCalledWith('link-1', 'portion')
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('removes from all Portions with the all scope when the switch is on', async () => {
    const removeProductAccompaniment = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    useRemoveProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeProductAccompaniment,
    } as never)
    const { result } = renderHook(() =>
      useRemoveGlobalAccompanimentDialog(createProps({ onSuccess })),
    )

    act(() => result.current.handleRemoveAllChange(true))
    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(removeProductAccompaniment).toHaveBeenCalledWith('link-1', 'all')
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('maps a failure to an inline error and preserves the chosen scope', async () => {
    useRemoveProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeProductAccompaniment: vi.fn().mockRejectedValue(new Error('request failed')),
    } as never)
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useRemoveGlobalAccompanimentDialog(createProps({ onSuccess })),
    )

    act(() => result.current.handleRemoveAllChange(true))
    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(result.current.actionError).toBe('request failed')
    expect(result.current.removeAll).toBe(true)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('uses a generic message for failures that are not errors', async () => {
    useRemoveProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeProductAccompaniment: vi.fn().mockRejectedValue('boom'),
    } as never)
    const { result } = renderHook(() => useRemoveGlobalAccompanimentDialog(createProps()))

    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(result.current.actionError).toBe('Não foi possível remover. Tente novamente.')
  })

  it('clears a previous error when the scope changes', async () => {
    useRemoveProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeProductAccompaniment: vi.fn().mockRejectedValue(new Error('request failed')),
    } as never)
    const { result } = renderHook(() => useRemoveGlobalAccompanimentDialog(createProps()))

    await act(async () => {
      await result.current.handleConfirm()
    })
    act(() => result.current.handleRemoveAllChange(true))

    expect(result.current.actionError).toBeNull()
  })

  it('exposes the pending state and the pending action label', () => {
    useRemoveProductAccompanimentActionMock.mockReturnValue({
      isPending: true,
      removeProductAccompaniment: vi.fn(),
    } as never)
    const { result } = renderHook(() => useRemoveGlobalAccompanimentDialog(createProps()))

    expect(result.current.isPending).toBe(true)
    expect(result.current.actionLabel).toBe('Removendo…')
  })

  it('turns the scope switch off and clears errors on every open', async () => {
    useRemoveProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeProductAccompaniment: vi.fn().mockRejectedValue(new Error('request failed')),
    } as never)
    const { result, rerender } = renderHook(
      ({ open }) => useRemoveGlobalAccompanimentDialog(createProps({ open })),
      { initialProps: { open: true } },
    )

    act(() => result.current.handleRemoveAllChange(true))
    await act(async () => {
      await result.current.handleConfirm()
    })
    rerender({ open: false })
    expect(result.current.removeAll).toBe(true)
    rerender({ open: true })

    expect(result.current.removeAll).toBe(false)
    expect(result.current.actionError).toBeNull()
  })
})
