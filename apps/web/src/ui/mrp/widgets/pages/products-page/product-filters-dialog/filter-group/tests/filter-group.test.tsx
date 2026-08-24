import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FilterGroup } from '../index'

describe('FilterGroup', () => {
  it('groups controls under an accessible legend', () => {
    render(
      <FilterGroup label='Categoria'>
        <button type='button'>Ingrediente</button>
      </FilterGroup>,
    )

    expect(screen.getByRole('group', { name: 'Categoria' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ingrediente' })).toBeTruthy()
  })
})
