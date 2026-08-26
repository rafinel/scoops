import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SalesChannelsEmptyState } from '..'

describe('SalesChannelsEmptyState', () => {
  it('teaches the first action', () => {
    const onAdd = vi.fn()
    render(<SalesChannelsEmptyState onAdd={onAdd} />)
    fireEvent.click(screen.getByRole('button', { name: 'Novo canal' }))
    expect(onAdd).toHaveBeenCalledOnce()
  })
})
