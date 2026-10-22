import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { GlobalBadge } from '../index'

describe('GlobalBadge', () => {
  afterEach(cleanup)

  it('renders the Global label', () => {
    render(<GlobalBadge />)

    expect(screen.getByText('Global').textContent).toBe('Global')
  })
})
