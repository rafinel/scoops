import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  AccompanimentQuantityField,
  type AccompanimentQuantityFieldProps,
} from '../index'

function renderField(overrides: Partial<AccompanimentQuantityFieldProps> = {}) {
  return render(
    <AccompanimentQuantityField
      quantityRegistration={
        {
          name: 'quantityPerPortion',
          onBlur: async () => undefined,
          onChange: async () => undefined,
          ref: () => undefined,
        } as AccompanimentQuantityFieldProps['quantityRegistration']
      }
      unit='g'
      {...overrides}
    />,
  )
}

describe('AccompanimentQuantityField', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('renders a decimal text input with the unit suffix', () => {
    renderField()

    const input = screen.getByRole('textbox', {
      name: /Quantidade por porção/,
    }) as HTMLInputElement
    expect(input.name).toBe('quantityPerPortion')
    expect(input.getAttribute('inputmode')).toBe('decimal')
    expect(input.getAttribute('aria-invalid')).toBe('false')
    expect(screen.getByText('g')).toBeTruthy()
  })

  it('marks the input invalid and shows the validation message', () => {
    renderField({ quantityError: 'Informe uma quantidade maior que zero.' })

    expect(
      screen
        .getByRole('textbox', { name: /Quantidade por porção/ })
        .getAttribute('aria-invalid'),
    ).toBe('true')
    expect(screen.getByText('Informe uma quantidade maior que zero.')).toBeTruthy()
  })
})
