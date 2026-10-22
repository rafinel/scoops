import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { GlobalReplacementNotice } from '../index'

describe('GlobalReplacementNotice', () => {
  afterEach(cleanup)

  it('renders nothing when no individual link needs replacing', () => {
    render(<GlobalReplacementNotice isVisible={false} />)

    expect(screen.queryByRole('status')).toBeNull()
  })

  it('uses the Portion-side wording by default and exposes the given id', () => {
    render(<GlobalReplacementNotice id='replacement' isVisible />)

    const notice = screen.getByRole('status')
    expect(notice.id).toBe('replacement')
    expect(notice.textContent).toBe(
      'Este acompanhamento já está vinculado individualmente a outras porções. Ao salvar, esses vínculos serão substituídos pela configuração global.',
    )
  })

  it('uses the Accompaniment-side wording, naming the replaced price, on the Portions tab', () => {
    render(<GlobalReplacementNotice isVisible wording='accompaniment-side' />)

    expect(screen.getByRole('status').textContent).toBe(
      'Este acompanhamento já está vinculado individualmente a algumas porções. Ao salvar, esses vínculos serão substituídos pela configuração global (tipo, quantidade e preço).',
    )
  })
})
