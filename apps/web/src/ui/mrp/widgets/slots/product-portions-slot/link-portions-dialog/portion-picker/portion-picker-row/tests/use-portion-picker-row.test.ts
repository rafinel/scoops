import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { usePortionPickerRow } from '../use-portion-picker-row'

function renderRow(isSelected = false) {
  const onToggle = vi.fn()
  const hook = renderHook(() =>
    usePortionPickerRow({
      candidate: { productId: 'portion-1', name: 'Açaí', status: 'active' },
      isSelected,
      onToggle,
    }),
  )
  return { ...hook, onToggle }
}

function createKeyEvent(key: string) {
  const preventDefault = vi.fn()
  return { event: { key, preventDefault } as never, preventDefault }
}

describe('usePortionPickerRow', () => {
  it('derives stable name and status ids from the Portion id', () => {
    const { result } = renderRow()

    expect(result.current.nameId).toBe('portion-picker-name-portion-1')
    expect(result.current.statusId).toBe('portion-picker-status-portion-1')
  })

  it('reports the checked value for the Portion', () => {
    const { result, onToggle } = renderRow()

    result.current.handleCheckedChange(true)
    result.current.handleCheckedChange(false)

    expect(onToggle).toHaveBeenNthCalledWith(1, 'portion-1', true)
    expect(onToggle).toHaveBeenNthCalledWith(2, 'portion-1', false)
  })

  it('toggles on Enter instead of submitting the form', () => {
    const unselected = renderRow(false)
    const enter = createKeyEvent('Enter')

    unselected.result.current.handleKeyDown(enter.event)

    expect(enter.preventDefault).toHaveBeenCalledTimes(1)
    expect(unselected.onToggle).toHaveBeenCalledWith('portion-1', true)
    const selected = renderRow(true)
    selected.result.current.handleKeyDown(createKeyEvent('Enter').event)
    expect(selected.onToggle).toHaveBeenCalledWith('portion-1', false)
  })

  it('ignores every other key', () => {
    const { result, onToggle } = renderRow()
    const space = createKeyEvent(' ')

    result.current.handleKeyDown(space.event)
    result.current.handleKeyDown(createKeyEvent('Tab').event)

    expect(space.preventDefault).not.toHaveBeenCalled()
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('derives the active flag from the candidate status', () => {
    const active = renderHook(() =>
      usePortionPickerRow({
        candidate: { productId: 'a', name: 'A', status: 'active' },
        isSelected: false,
        onToggle: vi.fn(),
      }),
    )
    const inactive = renderHook(() =>
      usePortionPickerRow({
        candidate: { productId: 'b', name: 'B', status: 'inactive' },
        isSelected: false,
        onToggle: vi.fn(),
      }),
    )

    expect(active.result.current.isActive).toBe(true)
    expect(inactive.result.current.isActive).toBe(false)
  })
})
