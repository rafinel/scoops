import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { OrderVerificationState } from '..'

describe('OrderVerificationState', () => {
  afterEach(cleanup)

  it('keeps the transport verification state neutral', async () => {
    const { rerender } = render(<OrderVerificationState isVisible />)

    expect(screen.getByRole('status', { name: 'Verificando registro' })).toBeTruthy()
    expect(screen.getByText('Verificando registro')).toBeTruthy()
    expect(screen.queryByText(/não foi registrado/i)).toBeNull()
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('status', { name: 'Verificando registro' }),
      ),
    )

    rerender(<OrderVerificationState isVisible={false} />)
    expect(screen.queryByRole('status', { name: 'Verificando registro' })).toBeNull()
  })
})
