import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useRemoveRecipeIngredientAction } from '@/ui/mrp/hooks/use-remove-recipe-ingredient-action'
import { useRemoveRecipeIngredientDialog } from '../use-remove-recipe-ingredient-dialog'

vi.mock('@/ui/mrp/hooks/use-remove-recipe-ingredient-action', () => ({
  useRemoveRecipeIngredientAction: vi.fn(),
}))
const mockedAction = vi.mocked(useRemoveRecipeIngredientAction)

describe('useRemoveRecipeIngredientDialog', () => {
  it('removes a line and reports failures', async () => {
    const removeRecipeIngredient = vi.fn().mockResolvedValue(undefined)
    mockedAction.mockReturnValue({ removeRecipeIngredient, isPending: false } as never)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useRemoveRecipeIngredientDialog('product-1'))

    await act(async () => result.current.handleRemove('line-1', onSuccess))
    expect(removeRecipeIngredient).toHaveBeenCalledWith('line-1')
    expect(onSuccess).toHaveBeenCalledTimes(1)

    mockedAction.mockReturnValue({
      removeRecipeIngredient: vi.fn().mockRejectedValue(new Error('Falha')),
      isPending: false,
    } as never)
    const failed = renderHook(() => useRemoveRecipeIngredientDialog('product-1'))
    await act(async () => failed.result.current.handleRemove('line-2', vi.fn()))
    expect(failed.result.current.error).toBe('Falha')
  })
})
