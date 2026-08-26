import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SalesChannelsError } from '..'

describe('SalesChannelsError', () => {
  it('offers a retry action', () => {
    const onRetry = vi.fn()
    render(<SalesChannelsError onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
