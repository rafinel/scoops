import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { GlobalScopeNotice } from '../index'

describe('GlobalScopeNotice', () => {
  afterEach(cleanup)

  it('renders nothing for an individual accompaniment', () => {
    render(<GlobalScopeNotice isGlobal={false} />)

    expect(screen.queryByRole('status')).toBeNull()
  })

  it('announces that changes apply to every Portion', () => {
    render(<GlobalScopeNotice isGlobal />)

    expect(screen.getByRole('status').textContent).toBe(
      'Acompanhamento global: as alterações valem para todas as porções.',
    )
  })

  it('also explains how global status ends when the removal explanation is requested', () => {
    render(<GlobalScopeNotice explainsRemoval isGlobal />)

    expect(screen.getByRole('status').textContent).toBe(
      'Acompanhamento global: as alterações valem para todas as porções. Para deixar de ser global, use Remover na tabela.',
    )
  })

  it('announces a custom message in the same notice', () => {
    render(<GlobalScopeNotice isGlobal message='Este acompanhamento agora é global.' />)

    expect(screen.getByRole('status').textContent).toBe(
      'Este acompanhamento agora é global.',
    )
  })
})
