import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { InternalNotesCard } from '../index'
import { useInternalNotesCard } from '../use-internal-notes-card'

vi.mock('../use-internal-notes-card', () => ({ useInternalNotesCard: vi.fn() }))
const hookMock = vi.mocked(useInternalNotesCard)

describe('InternalNotesCard', () => {
  it('keeps the attempted note and saves it on blur through the owning hook', () => {
    const handleBlur = vi.fn()
    hookMock.mockReturnValue({
      error: undefined,
      handleBlur,
      handleRetry: vi.fn(),
      handleRevert: vi.fn(),
      internalNotes: 'Só o gerente vê.',
      isPending: false,
      setInternalNotes: vi.fn(),
    })
    render(<InternalNotesCard product={ProductFaker.fake()} />)
    const textarea = screen.getByRole('textbox', { name: 'Observação' })
    expect(screen.queryByText('Só o gerente vê.', { selector: 'p' })).toBeNull()
    expect((textarea as HTMLTextAreaElement).value).toBe('Só o gerente vê.')
    fireEvent.blur(textarea)
    expect(handleBlur).toHaveBeenCalledOnce()
  })
})
