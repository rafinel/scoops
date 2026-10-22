import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { ProductDetailsTabs, type ProductDetailsTab } from '../index'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route].replace('$productId', String(params?.productId))} {...props}>
      {children}
    </a>
  ),
}))

function renderTabs(
  categories: ProductCategory[],
  selectedTab: ProductDetailsTab = 'stock',
) {
  const product = ProductFaker.fake({ id: 'product-1', categories })
  return render(<ProductDetailsTabs product={product} selectedTab={selectedTab} />)
}

function getTabLabels() {
  return screen.getAllByRole('tab').map((tab) => tab.textContent?.trim())
}

describe('ProductDetailsTabs', () => {
  afterEach(cleanup)

  it.each([
    ['an Accompaniment only', ['accompaniment'], ['Estoque', 'Porções', 'Configurações']],
    [
      'an Accompaniment with Resale',
      ['accompaniment', 'resale'],
      ['Estoque', 'Porções', 'Preços', 'Configurações'],
    ],
    [
      'an Accompaniment with Manufacturable',
      ['accompaniment', 'manufacturable'],
      ['Estoque', 'Receita', 'Porções', 'Configurações'],
    ],
    [
      'a legacy Portion with Accompaniment',
      ['portion', 'accompaniment'],
      ['Estoque', 'Acompanhamentos', 'Preços', 'Configurações'],
    ],
    ['a Portion', ['portion'], ['Estoque', 'Acompanhamentos', 'Preços', 'Configurações']],
    ['an Ingredient', ['ingredient'], ['Estoque', 'Configurações']],
  ] as const)('shows the expected tabs for %s', (_label, categories, expected) => {
    renderTabs([...categories])

    expect(getTabLabels()).toEqual(expected)
  })

  it('shows Porções only for an Accompaniment without the Portion category', () => {
    renderTabs(['accompaniment'])

    expect(screen.getByRole('tab', { name: 'Porções' })).toBeTruthy()
    cleanup()
    renderTabs(['portion', 'accompaniment'])
    expect(screen.queryByRole('tab', { name: 'Porções' })).toBeNull()
    cleanup()
    renderTabs(['ingredient'])
    expect(screen.queryByRole('tab', { name: 'Porções' })).toBeNull()
  })

  it('links the Porções tab to the product portions route and marks it selected', () => {
    renderTabs(['accompaniment'], 'portions')

    const tab = screen.getByRole('tab', { name: 'Porções' })
    expect(tab.getAttribute('href')).toBe('/products/product-1/portions')
    expect(tab.getAttribute('aria-selected')).toBe('true')
    expect(
      screen.getByRole('tab', { name: 'Estoque' }).getAttribute('aria-selected'),
    ).toBe('false')
  })

  it('places Porções after the Accompaniments position and before Preços', () => {
    renderTabs(['accompaniment', 'resale'])

    expect(getTabLabels()).toEqual(['Estoque', 'Porções', 'Preços', 'Configurações'])
    expect(screen.getByRole('tablist', { name: 'Detalhes do produto' })).toBeTruthy()
  })
})
