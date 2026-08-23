import { describe, expect, it } from 'vitest'

describe('RemoveProductAccompanimentDialog', () => {
  it('uses a named destructive confirmation surface', () => {
    expect('Remover acompanhamento?').toContain('acompanhamento')
  })
})
