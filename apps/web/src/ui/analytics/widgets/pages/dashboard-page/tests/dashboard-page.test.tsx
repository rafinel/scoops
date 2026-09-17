import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardPage } from '../index'
import { useDashboardPage } from '../use-dashboard-page'

vi.mock('../use-dashboard-page', () => ({ useDashboardPage: vi.fn() }))

const useDashboardPageMock = vi.mocked(useDashboardPage)

describe('DashboardPage', () => {
  beforeEach(() => {
    useDashboardPageMock.mockReturnValue({
      period: 'last-30-days',
      setPeriod: vi.fn(),
      refresh: vi.fn(),
      isRefreshing: false,
      sales: {
        data: undefined,
        error: null,
        isLoading: true,
        isRefreshing: false,
        isStale: false,
        refetch: vi.fn(),
      },
      stock: {
        data: undefined,
        error: null,
        isLoading: true,
        isRefreshing: false,
        isStale: false,
        refetch: vi.fn(),
      },
    })
  })

  it('renders independent loading status messages', () => {
    render(<DashboardPage />)
    expect(screen.getByRole('status', { name: 'Carregando vendas' })).toBeTruthy()
    expect(screen.getByRole('status', { name: 'Carregando estoque' })).toBeTruthy()
    expect(
      screen.getByRole('status', { name: 'Carregando vendas' }).getAttribute('aria-busy'),
    ).toBe('true')
    expect(
      screen
        .getByRole('status', { name: 'Carregando estoque' })
        .getAttribute('aria-busy'),
    ).toBe('true')
    expect(document.querySelectorAll('section[aria-hidden="true"]').length).toBe(3)
  })
})
