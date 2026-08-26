import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SalesChannelsLoading } from '..'

describe('SalesChannelsLoading', () => {
  it('announces the loading state', () => {
    render(<SalesChannelsLoading />)
    expect(
      screen.getByRole('status', { name: 'Carregando canais de venda' }),
    ).toBeTruthy()
  })
})
