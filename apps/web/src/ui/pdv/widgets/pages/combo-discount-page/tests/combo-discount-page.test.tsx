import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ComboDiscountPage } from '..'
import { useComboDiscountPage } from '../use-combo-discount-page'

import { comboDetails } from './combo-test-fixtures'

vi.mock('../use-combo-discount-page', () => ({ useComboDiscountPage: vi.fn() }))
vi.mock('../combo-discount-form', () => ({
  ComboDiscountForm: () => <div data-testid='combo-form' />,
}))
vi.mock('../change-combo-status-dialog', () => ({
  ChangeComboStatusDialog: () => <div data-testid='status-dialog' />,
}))
vi.mock('../delete-combo-dialog', () => ({
  DeleteComboDialog: () => <div data-testid='delete-dialog' />,
}))

const useComboDiscountPageMock = vi.mocked(useComboDiscountPage)

function createView() {
  return {
    announcement: '',
    comboDetails: undefined,
    comboDetailsError: null,
    handleCancel: vi.fn(),
    handleDeleteOpenChange: vi.fn(),
    handleDeleteSuccess: vi.fn(),
    handleRequestDelete: vi.fn(),
    handleRequestStatusChange: vi.fn(),
    handleRetry: vi.fn(),
    handleStatusOpenChange: vi.fn(),
    handleStatusSuccess: vi.fn(),
    handleSubmit: vi.fn().mockResolvedValue(undefined),
    isComboDetailsError: false,
    isDeleteOpen: false,
    isLoadingComboDetails: false,
    isPending: false,
    statusTarget: undefined,
    submitError: null,
  }
}

describe('ComboDiscountPage', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    useComboDiscountPageMock.mockReturnValue(createView())
  })

  it('renders the create form shell and returns through the cancel action', () => {
    render(<ComboDiscountPage mode='create' />)
    expect(screen.getByRole('heading', { name: 'Adicionar desconto' })).toBeTruthy()
    expect(screen.getByTestId('combo-form')).toBeTruthy()
  })

  it('renders edit lifecycle boundaries and a recoverable load error', () => {
    useComboDiscountPageMock.mockReturnValue({
      ...createView(),
      comboDetails,
      isDeleteOpen: true,
      statusTarget: 'inactive',
    })
    render(<ComboDiscountPage comboId='combo-1' mode='edit' />)
    expect(screen.getByRole('heading', { name: 'Editar desconto' })).toBeTruthy()
    expect(screen.getByTestId('status-dialog')).toBeTruthy()
    expect(screen.getByTestId('delete-dialog')).toBeTruthy()

    useComboDiscountPageMock.mockReturnValue({
      ...createView(),
      isComboDetailsError: true,
    })
    cleanup()
    render(<ComboDiscountPage comboId='missing' mode='edit' />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(
      useComboDiscountPageMock.mock.results.at(-1)?.value.handleRetry,
    ).toHaveBeenCalledOnce()
  })
})
