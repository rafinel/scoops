import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AffixedInput } from '..'

describe('AffixedInput', () => {
  afterEach(cleanup)

  it('renders only the input when no affix is given', () => {
    render(<AffixedInput aria-label='Valor' />)

    expect(screen.getByRole('textbox', { name: 'Valor' })).not.toBeNull()
    expect(screen.queryByText('R$')).toBeNull()
  })

  it('renders the prefix before and the suffix after the input', () => {
    render(<AffixedInput aria-label='Valor' prefixText='R$' suffixText='kg' />)

    const input = screen.getByRole('textbox', { name: 'Valor' })
    const prefix = screen.getByText('R$')
    const suffix = screen.getByText('kg')
    expect(
      prefix.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      input.compareDocumentPosition(suffix) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('passes the input props through and delegates its focus ring to the wrapper', () => {
    const onChange = vi.fn()
    render(
      <AffixedInput
        aria-describedby='hint'
        aria-invalid
        aria-label='Valor'
        className='font-extrabold'
        inputMode='decimal'
        onChange={onChange}
        placeholder='0,00'
        prefixText='R$'
        value=''
      />,
    )

    const input = screen.getByRole('textbox', { name: 'Valor' })
    fireEvent.change(input, { target: { value: '1,5' } })

    expect(onChange).toHaveBeenCalledOnce()
    expect(input.getAttribute('aria-describedby')).toBe('hint')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('inputmode')).toBe('decimal')
    expect(input.getAttribute('placeholder')).toBe('0,00')
    expect(input.getAttribute('data-focus-ring')).toBe('delegated')
    expect(input.className).toContain('font-extrabold')
  })
})
