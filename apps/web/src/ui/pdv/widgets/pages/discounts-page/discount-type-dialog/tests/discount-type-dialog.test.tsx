import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DiscountTypeDialog } from '..'
import { useDiscountTypeDialog } from '../use-discount-type-dialog'

vi.mock('../use-discount-type-dialog', () => ({ useDiscountTypeDialog: vi.fn() }))

describe('DiscountTypeDialog', () => {
  afterEach(cleanup)
  beforeEach(() =>
    vi
      .mocked(useDiscountTypeDialog)
      .mockReturnValue({ handleChooseCombo: vi.fn(), handleOpenChange: vi.fn() }),
  )

  it('shows Combo as the enabled type and other types as future work', () => {
    render(<DiscountTypeDialog onChoose={vi.fn()} onOpenChange={vi.fn()} open />)
    expect(
      (screen.getByRole('button', { name: /Combo/ }) as HTMLButtonElement).disabled,
    ).toBe(false)
    expect(screen.getAllByRole('button', { name: /Em breve/ })).toHaveLength(2)
    expect(
      (screen.getAllByRole('button', { name: /Em breve/ })[0] as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /Combo/ }))
    expect(
      vi.mocked(useDiscountTypeDialog).mock.results[0].value.handleChooseCombo,
    ).toHaveBeenCalledOnce()
  })
})
