import type { ReactNode } from 'react'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { DashboardSalesStatus } from '../index'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route }: { children: ReactNode; route: string }) => (
    <a href={route === 'newSale' ? '/sales/new' : '#'}>{children}</a>
  ),
}))

describe('DashboardSalesStatus', () => {
  afterEach(() => cleanup())

  it('guides the Manager to register the first sale when there is no sales data', () => {
    render(
      <DashboardSalesStatus hasSalesData={false}>
        <p>Sales content</p>
      </DashboardSalesStatus>,
    )

    expect(
      screen.getByRole('heading', { name: 'Ainda não há dados suficientes' }),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Registre sua primeira venda para acompanhar a evolução, os produtos mais vendidos e os canais de venda neste período.',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Registrar primeira venda' }).getAttribute('href'),
    ).toBe('/sales/new')
    expect(screen.queryByText('Sales content')).toBeNull()
  })

  it('renders sales content when the period has valid orders', () => {
    render(
      <DashboardSalesStatus hasSalesData={true}>
        <p>Sales content</p>
      </DashboardSalesStatus>,
    )

    expect(screen.getByText('Sales content')).toBeTruthy()
    expect(
      screen.queryByRole('heading', { name: 'Ainda não há dados suficientes' }),
    ).toBeNull()
  })
})
