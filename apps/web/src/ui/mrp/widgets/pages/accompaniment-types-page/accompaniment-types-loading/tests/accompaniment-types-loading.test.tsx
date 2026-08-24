import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AccompanimentTypesLoading } from '../index'

describe('AccompanimentTypesLoading', () => {
  it('announces that accompaniment types are loading', () => {
    render(<AccompanimentTypesLoading />)

    expect(
      screen
        .getByRole('status', { name: 'Carregando tipos de acompanhamento' })
        .getAttribute('aria-busy'),
    ).toBe('true')
  })
})
