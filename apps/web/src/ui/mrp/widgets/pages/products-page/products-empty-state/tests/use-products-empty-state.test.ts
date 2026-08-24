import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useProductsEmptyState } from '../use-products-empty-state'

describe('useProductsEmptyState', () => {
  it('describes an empty catalog and a filtered result separately', () => {
    const empty = renderHook(() => useProductsEmptyState(false))
    expect(empty.result.current.title).toBe('Seu catálogo está vazio')

    const filtered = renderHook(() => useProductsEmptyState(true))
    expect(filtered.result.current.title).toBe('Nenhum produto encontrado')
  })
})
