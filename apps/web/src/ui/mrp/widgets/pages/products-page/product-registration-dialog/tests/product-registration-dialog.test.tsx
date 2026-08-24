import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductRegistrationDialog } from '../index'
import { useProductRegistrationDialog } from '../use-product-registration-dialog'

vi.mock('../use-product-registration-dialog', () => ({
  useProductRegistrationDialog: vi.fn(),
}))
const useProductRegistrationDialogMock = vi.mocked(useProductRegistrationDialog)

const createForm = () => ({
  allowNegativeStock: false,
  brands: [
    {
      id: 'brand-1',
      name: 'Frooty',
      packageQuantity: '1',
      packagePrice: '12,50',
      packageCount: '2',
      isPrimary: true,
    },
  ],
  calculatedInitialStock: 2,
  categories: [ProductCategory.Ingredient],
  currentUnitCost: '2,50',
  fieldErrors: {},
  formError: null,
  idealStock: '10',
  initialStock: '2',
  isPending: false,
  name: 'Polpa',
  stockControl: 'single',
  unit: 'kg' as const,
  handleAddBrand: vi.fn(),
  handleAllowNegativeStockChange: vi.fn(),
  handleBrandChange: vi.fn(),
  handleIdealStockChange: vi.fn(),
  handleInitialStockChange: vi.fn(),
  handleCurrentUnitCostChange: vi.fn(),
  handleNameChange: vi.fn(),
  handleProductCategoryToggle: vi.fn(),
  handleRegister: vi.fn((event: { preventDefault: () => void }) =>
    event.preventDefault(),
  ),
  handleRemoveBrand: vi.fn(),
  handleStockControlChange: vi.fn(),
  handleUnitChange: vi.fn(),
  isCategoryDisabled: vi.fn(() => false),
  register: vi.fn((name: string) => ({ name })),
})

describe('ProductRegistrationDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useProductRegistrationDialogMock.mockReturnValue(createForm() as never)
  })

  it('renders product fields, categories and submits the form', () => {
    render(
      <ProductRegistrationDialog isOpen onOpenChange={vi.fn()} onSuccess={vi.fn()} />,
    )

    expect(screen.getByRole('dialog', { name: 'Novo produto' })).toBeTruthy()
    expect(screen.getByDisplayValue('Polpa')).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: 'Ingrediente' })).toBeTruthy()
    expect(screen.getByText('Custo unitário atual')).toBeTruthy()
    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)
    expect(
      useProductRegistrationDialogMock.mock.results[0].value.handleRegister,
    ).toHaveBeenCalled()
  })

  it('renders the brand section when stock is controlled by brand', () => {
    useProductRegistrationDialogMock.mockReturnValue({
      ...createForm(),
      stockControl: 'by-brand',
    } as never)
    render(
      <ProductRegistrationDialog isOpen onOpenChange={vi.fn()} onSuccess={vi.fn()} />,
    )

    expect(screen.getByRole('heading', { name: 'Marcas do produto' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Adicionar marca' })).toBeTruthy()
  })
})
