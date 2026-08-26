import { act, renderHook } from '@testing-library/react'
import { AccompanimentTypeFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { describe, expect, it, vi } from 'vitest'

import { useAccompanimentTypesQuery } from '@/ui/mrp/hooks/use-accompaniment-types-query'
import { useAccompanimentTypesPage } from '../use-accompaniment-types-page'

vi.mock('@/ui/mrp/hooks/use-accompaniment-types-query', () => ({
  useAccompanimentTypesQuery: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({ useRouter: vi.fn() }))
import { useRouter } from '@tanstack/react-router'
const useAccompanimentTypesQueryMock = vi.mocked(useAccompanimentTypesQuery)
const useRouterMock = vi.mocked(useRouter)
const item = {
  type: AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' }),
  usageCount: 0,
}

describe('useAccompanimentTypesPage', () => {
  it('manages actions, pagination, retry and browser back navigation', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined)
    const back = vi.fn()
    useRouterMock.mockReturnValue({ history: { canGoBack: () => true, back } } as never)
    useAccompanimentTypesQueryMock.mockReturnValue({
      data: { items: [item], page: 1, pageSize: 10, total: 1, totalPages: 1 },
      isError: false,
      isPending: false,
      refetch,
    } as never)
    const onPageChange = vi.fn()
    const { result } = renderHook(() => useAccompanimentTypesPage(1, onPageChange))

    act(() => result.current.handleEditAction(item))
    expect(result.current.selectedAction).toEqual({ kind: 'edit', item })
    act(() => result.current.handleActionOpenChange(false))
    expect(result.current.selectedAction).toBeUndefined()
    act(() => result.current.handleActionSuccess())
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(result.current.isLoading).toBe(false)
    act(() => result.current.handleRetry())
    expect(refetch).toHaveBeenCalledTimes(2)
    const preventDefault = vi.fn()
    act(() => result.current.handleBack({ preventDefault } as never))
    expect(preventDefault).toHaveBeenCalledTimes(1)
    expect(back).toHaveBeenCalledTimes(1)
    expect(onPageChange).not.toHaveBeenCalled()
  })
})
