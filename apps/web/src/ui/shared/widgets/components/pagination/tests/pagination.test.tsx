import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { Pagination } from '../index'

describe('Pagination', () => {
  afterEach(cleanup)

  it('renders the summary, page range, and active page', () => {
    render(
      <Pagination currentPage={1} pageSize={5} totalItems={47} onPageChange={vi.fn()} />,
    )

    expect(screen.getByText('Mostrando 1-5 de 47').textContent).toBe(
      'Mostrando 1-5 de 47',
    )
    expect(
      screen.getByRole('button', { name: 'Página 1' }).getAttribute('aria-current'),
    ).toBe('page')
    expect(
      (screen.getByRole('button', { name: 'Página anterior' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Próxima página' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
    expect(screen.getByRole('button', { name: 'Página 5' })).not.toBeNull()
  })

  it('notifies the selected page and advances the visible range', () => {
    const onPageChange = vi.fn()

    render(
      <Pagination
        currentPage={1}
        pageSize={5}
        totalItems={47}
        onPageChange={onPageChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Página 3' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 2)
  })

  it('renders nothing when there is only one page', () => {
    const { container } = render(
      <Pagination currentPage={1} pageSize={5} totalItems={5} onPageChange={vi.fn()} />,
    )

    expect(container.innerHTML).toBe('')
  })
})
