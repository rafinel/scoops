import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useSaveRecipeYieldAction } from '@/ui/mrp/hooks/use-save-recipe-yield-action'
import { useProductRecipeCard } from '../use-product-recipe-card'

vi.mock('@/ui/mrp/hooks/use-save-recipe-yield-action', () => ({
  useSaveRecipeYieldAction: vi.fn(),
}))

const mockedAction = vi.mocked(useSaveRecipeYieldAction)

describe('useProductRecipeCard', () => {
  it('saves a valid yield as a number', async () => {
    const saveRecipeYield = vi.fn().mockResolvedValue(undefined)
    mockedAction.mockReturnValue({ saveRecipeYield, isPending: false } as never)
    const { result } = renderHook(() => useProductRecipeCard('product-1', null))

    act(() => result.current.setYieldQuantity('2.5'))
    await act(async () => result.current.handleSaveYield())

    expect(saveRecipeYield).toHaveBeenCalledWith({ yieldQuantity: 2.5 })
    expect(result.current.error).toBeNull()
  })

  it('rejects invalid yields and exposes action errors', async () => {
    const saveRecipeYield = vi.fn().mockRejectedValue(new Error('Falha ao salvar'))
    mockedAction.mockReturnValue({ saveRecipeYield, isPending: false } as never)
    const { result } = renderHook(() => useProductRecipeCard('product-1', null))

    act(() => result.current.setYieldQuantity('1.2345'))
    await act(async () => result.current.handleSaveYield())
    expect(saveRecipeYield).not.toHaveBeenCalled()
    expect(result.current.error).toBe(
      'Informe um rendimento positivo com até três casas decimais.',
    )

    act(() => result.current.setYieldQuantity('2'))
    await act(async () => result.current.handleSaveYield())
    expect(result.current.error).toBe('Falha ao salvar')
  })
})
