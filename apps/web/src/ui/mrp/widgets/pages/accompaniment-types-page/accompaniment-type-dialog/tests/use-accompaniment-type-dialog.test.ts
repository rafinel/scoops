import { act, renderHook } from '@testing-library/react'
import { AccompanimentTypeFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { describe, expect, it, vi } from 'vitest'

import { useCreateAccompanimentTypeAction } from '@/ui/mrp/hooks/use-create-accompaniment-type-action'
import { useRenameAccompanimentTypeAction } from '@/ui/mrp/hooks/use-rename-accompaniment-type-action'
import { useAccompanimentTypeDialog } from '../use-accompaniment-type-dialog'

vi.mock('@/ui/mrp/hooks/use-create-accompaniment-type-action', () => ({
  useCreateAccompanimentTypeAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-rename-accompaniment-type-action', () => ({
  useRenameAccompanimentTypeAction: vi.fn(),
}))
const useCreateAccompanimentTypeActionMock = vi.mocked(useCreateAccompanimentTypeAction)
const useRenameAccompanimentTypeActionMock = vi.mocked(useRenameAccompanimentTypeAction)
const item = {
  type: AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' }),
  usageCount: 0,
}

describe('useAccompanimentTypeDialog', () => {
  it('creates a type and renames an existing type', async () => {
    const createAccompanimentType = vi.fn().mockResolvedValue(undefined)
    const renameAccompanimentType = vi.fn().mockResolvedValue(undefined)
    useCreateAccompanimentTypeActionMock.mockReturnValue({
      createAccompanimentType,
      isPending: false,
    } as never)
    useRenameAccompanimentTypeActionMock.mockReturnValue({
      renameAccompanimentType,
      isPending: false,
    } as never)
    const onSuccess = vi.fn()
    const create = renderHook(() => useAccompanimentTypeDialog({ onSuccess, open: true }))
    const field = create.result.current.register('name')
    const input = document.createElement('input')
    input.name = field.name
    document.body.append(input)
    field.ref(input)
    await act(async () => {
      await field.onChange({
        target: { name: 'name', value: 'Cobertura' },
        type: 'change',
      })
      await create.result.current.handleSubmit()
    })
    expect(createAccompanimentType).toHaveBeenCalledWith({ name: 'Cobertura' })
    expect(onSuccess).toHaveBeenCalledTimes(1)

    const editSuccess = vi.fn()
    const edit = renderHook(() =>
      useAccompanimentTypeDialog({ item, onSuccess: editSuccess, open: true }),
    )
    await act(async () => edit.result.current.handleSubmit())
    expect(renameAccompanimentType).toHaveBeenCalledWith({
      typeId: 'type-1',
      input: { name: 'Cobertura' },
    })
    expect(editSuccess).toHaveBeenCalledTimes(1)
  })

  it('maps action failures to the form error', async () => {
    useCreateAccompanimentTypeActionMock.mockReturnValue({
      createAccompanimentType: vi.fn().mockRejectedValue(new Error('Duplicado')),
      isPending: false,
    } as never)
    useRenameAccompanimentTypeActionMock.mockReturnValue({
      renameAccompanimentType: vi.fn(),
      isPending: false,
    } as never)
    const { result } = renderHook(() =>
      useAccompanimentTypeDialog({ onSuccess: vi.fn(), open: true }),
    )
    const field = result.current.register('name')
    const input = document.createElement('input')
    input.name = field.name
    document.body.append(input)
    field.ref(input)
    await act(async () => {
      await field.onChange({
        target: { name: 'name', value: 'Cobertura' },
        type: 'change',
      })
      await result.current.handleSubmit()
    })
    expect(result.current.actionError).toBe('Duplicado')
  })
})
