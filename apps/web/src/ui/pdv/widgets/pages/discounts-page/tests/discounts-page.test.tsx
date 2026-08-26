import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DiscountsPage } from '..'
import { useDiscountsPage } from '../use-discounts-page'

import { makeComboDetails } from './discount-test-fixtures'

vi.mock('../use-discounts-page', () => ({ useDiscountsPage: vi.fn() }))
vi.mock('../discount-type-dialog', () => ({
  DiscountTypeDialog: () => <div data-testid='discount-type-dialog' />,
}))
vi.mock('../discounts-list', () => ({
  DiscountsList: ({
    page,
  }: {
    page?: { items: Array<{ combo: { name: string; status: string } }> }
  }) => (
    <div>
      {page?.items.map((item) => (
        <div key={item.combo.name}>
          <span>{item.combo.name}</span>
          <span>{item.combo.status === 'active' ? 'Ativo' : 'Inativo'}</span>
        </div>
      ))}
    </div>
  ),
}))

const useDiscountsPageMock = vi.mocked(useDiscountsPage)

function createView() {
  return {
    discountsError: null,
    discountsPage: undefined,
    hasFilters: false,
    isDiscountsError: false,
    isFetchingDiscounts: false,
    isLoadingDiscounts: false,
    isTypeDialogOpen: false,
    search: { page: 1, pageSize: 10 },
    handleClearFilters: vi.fn(),
    handleChooseCombo: vi.fn(),
    handleCreate: vi.fn(),
    handleDetails: vi.fn(),
    handlePageChange: vi.fn(),
    handleRetry: vi.fn(),
    handleSearchChange: vi.fn(),
    handleStatusChange: vi.fn(),
    handleTypeChange: vi.fn(),
    handleTypeDialogOpenChange: vi.fn(),
  }
}

describe('DiscountsPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useDiscountsPageMock.mockReturnValue(createView())
  })

  it('renders the empty state and delegates creation', () => {
    useDiscountsPageMock.mockReturnValue({
      ...createView(),
      discountsPage: { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 },
    })
    render(<DiscountsPage />)
    expect(screen.getByRole('heading', { name: 'Descontos' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Criar primeiro desconto' }))
    expect(useDiscountsPageMock.mock.results[0].value.handleCreate).toHaveBeenCalledOnce()
  })

  it('composes loading, recoverable error and populated list states', () => {
    useDiscountsPageMock.mockReturnValue({ ...createView(), isLoadingDiscounts: true })
    const { rerender } = render(<DiscountsPage />)
    expect(screen.getByRole('status', { name: 'Carregando descontos' })).toBeTruthy()

    const handleRetry = vi.fn()
    useDiscountsPageMock.mockReturnValue({
      ...createView(),
      handleRetry,
      isDiscountsError: true,
    })
    rerender(<DiscountsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(handleRetry).toHaveBeenCalledOnce()

    useDiscountsPageMock.mockReturnValue({
      ...createView(),
      discountsPage: {
        items: [makeComboDetails()],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      },
    })
    rerender(<DiscountsPage />)
    expect(screen.getByText('Combo Açaí + Brownie')).toBeTruthy()
    expect(screen.getByText('Ativo')).toBeTruthy()
  })
})
