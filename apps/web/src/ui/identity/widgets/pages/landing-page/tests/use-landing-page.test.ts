import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'

import { useLandingPage } from '../use-landing-page'

describe('useLandingPage', () => {
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/')
  })

  it('does not perform provider hash navigation for a normal landing visit', () => {
    const initialUrl = window.location.href

    renderHook(() => useLandingPage())

    expect(window.location.href).toBe(initialUrl)
  })

  it('leaves query-token password recovery routing to its owning route', () => {
    window.history.replaceState(null, '', '/reset-password?token=reset-token')

    renderHook(() => useLandingPage())

    expect(window.location.pathname).toBe('/reset-password')
    expect(window.location.search).toBe('?token=reset-token')
  })

  it('does not consume a recovery hash because Better Auth uses cookie sessions', () => {
    window.history.replaceState(null, '', '/#error=access_denied')

    const initialHash = window.location.hash
    renderHook(() => useLandingPage())

    expect(window.location.hash).toBe(initialHash)
  })
})
