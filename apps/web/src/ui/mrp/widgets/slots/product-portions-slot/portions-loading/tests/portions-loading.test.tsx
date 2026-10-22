import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PortionsLoading } from '../index'

describe('PortionsLoading', () => {
  afterEach(cleanup)

  it('announces a busy loading status for the Portions', () => {
    render(<PortionsLoading />)

    const status = screen.getByRole('status', { name: 'Carregando porções' })
    expect(status.getAttribute('aria-busy')).toBe('true')
  })
})
