import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductStockControlCard, type ProductStockControlCardProps } from '..'

const brands = [
  {
    id: 'brand-1',
    name: 'Frooty',
    unit: 'un' as const,
    packageQuantity: '2',
    packagePrice: '12,50',
    packageCount: '3',
    isPrimary: true,
  },
  {
    id: 'brand-2',
    name: 'Frutamil',
    unit: 'un' as const,
    packageQuantity: '1',
    packagePrice: '8,00',
    packageCount: '4',
    isPrimary: false,
  },
]

function createProps(
  overrides: Partial<ProductStockControlCardProps> = {},
): ProductStockControlCardProps {
  return {
    allowNegativeStock: false,
    brands: [],
    calculatedInitialStock: 0,
    categories: [],
    currentUnitCost: '',
    fieldErrors: {},
    idealStock: '0',
    initialStock: '0',
    onAddBrand: vi.fn(),
    onAllowNegativeStockChange: vi.fn(),
    onBrandChange: vi.fn(),
    onCurrentUnitCostChange: vi.fn(),
    onIdealStockChange: vi.fn(),
    onInitialStockChange: vi.fn(),
    onPrimaryBrandChange: vi.fn(),
    onRemoveBrand: vi.fn(),
    onStockControlChange: vi.fn(),
    register: vi.fn(() => ({ name: 'field' })) as never,
    stockControl: 'single',
    ...overrides,
  }
}

describe('ProductStockControlCard', () => {
  afterEach(cleanup)

  it('renders single-stock values and delegates quantity and ingredient cost edits', () => {
    const onCurrentUnitCostChange = vi.fn()
    const onIdealStockChange = vi.fn()
    const onInitialStockChange = vi.fn()
    render(
      <ProductStockControlCard
        {...createProps({
          categories: [ProductCategory.Ingredient],
          currentUnitCost: '3.50',
          idealStock: '12',
          initialStock: '4',
          onCurrentUnitCostChange,
          onIdealStockChange,
          onInitialStockChange,
        })}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Estoque único' }).getAttribute('aria-pressed'),
    ).toBe('true')
    expect(screen.queryByRole('button', { name: 'Adicionar outra marca' })).toBeNull()

    const initialStock = screen.getByRole('spinbutton', { name: 'Estoque inicial' })
    const idealStock = screen.getByRole('spinbutton', { name: 'Estoque ideal' })
    const currentUnitCost = screen.getByRole('spinbutton', {
      name: /Custo unitário atual/,
    })
    expect((initialStock as HTMLInputElement).value).toBe('4')
    expect((initialStock as HTMLInputElement).min).toBe('0')
    expect((idealStock as HTMLInputElement).value).toBe('12')
    expect((idealStock as HTMLInputElement).min).toBe('0')
    expect((currentUnitCost as HTMLInputElement).value).toBe('3.50')
    expect(screen.getByText('R$', { selector: 'span' })).not.toBeNull()
    expect(screen.getByText('Usado no custo de receitas futuras.')).not.toBeNull()

    fireEvent.change(initialStock, { target: { value: '6' } })
    fireEvent.change(idealStock, { target: { value: '18' } })
    fireEvent.change(currentUnitCost, { target: { value: '4.25' } })
    expect(onInitialStockChange).toHaveBeenCalledWith('6')
    expect(onIdealStockChange).toHaveBeenCalledWith('18')
    expect(onCurrentUnitCostChange).toHaveBeenCalledWith('4.25')
  })

  it('shows ingredient cost only for single stock control', () => {
    const { rerender } = render(
      <ProductStockControlCard
        {...createProps({ categories: [ProductCategory.Ingredient] })}
      />,
    )
    expect(
      screen.getByRole('spinbutton', { name: /Custo unitário atual/ }),
    ).not.toBeNull()

    rerender(
      <ProductStockControlCard
        {...createProps({
          brands,
          categories: [ProductCategory.Ingredient],
          stockControl: 'by-brand',
        })}
      />,
    )
    expect(screen.queryByRole('spinbutton', { name: /Custo unitário atual/ })).toBeNull()

    rerender(
      <ProductStockControlCard
        {...createProps({ categories: [ProductCategory.Manufacturable] })}
      />,
    )
    expect(screen.queryByRole('spinbutton', { name: /Custo unitário atual/ })).toBeNull()
  })

  it('renders calculated stock and delegates by-brand editing and actions', () => {
    const onAddBrand = vi.fn()
    const onBrandChange = vi.fn()
    const onIdealStockChange = vi.fn()
    const onPrimaryBrandChange = vi.fn()
    const onRemoveBrand = vi.fn()
    render(
      <ProductStockControlCard
        {...createProps({
          brands,
          calculatedInitialStock: 8,
          fieldErrors: { idealStock: 'Informe um estoque ideal válido.' },
          idealStock: '10',
          onAddBrand,
          onBrandChange,
          onIdealStockChange,
          onPrimaryBrandChange,
          onRemoveBrand,
          stockControl: 'by-brand',
        })}
      />,
    )

    const firstBrand = screen.getByRole('group', { name: 'Marca 1' })
    const secondBrand = screen.getByRole('group', { name: 'Marca 2' })
    expect(within(firstBrand).getByDisplayValue('Frooty')).not.toBeNull()
    expect(within(secondBrand).getByDisplayValue('Frutamil')).not.toBeNull()
    const calculatedInitialStock = screen.getByDisplayValue('8') as HTMLInputElement
    expect(calculatedInitialStock.value).toBe('8')
    expect(calculatedInitialStock.readOnly).toBe(true)
    const idealStock = screen.getByRole('spinbutton', { name: /Estoque ideal/ })
    expect((idealStock as HTMLInputElement).value).toBe('10')
    expect(idealStock.getAttribute('aria-invalid')).toBe('true')
    expect(idealStock.getAttribute('aria-describedby')).toBe('ideal-stock-error')
    expect(screen.getByText('Informe um estoque ideal válido.')).not.toBeNull()
    expect(
      screen.getByText('Total calculado pelas quantidades iniciais das marcas.'),
    ).not.toBeNull()
    expect(screen.queryByRole('spinbutton', { name: /Custo unitário atual/ })).toBeNull()

    fireEvent.change(within(firstBrand).getByLabelText('Nome da marca'), {
      target: { value: 'Açaí' },
    })
    fireEvent.change(within(firstBrand).getByLabelText('Qtd. por embalagem'), {
      target: { value: '3' },
    })
    fireEvent.change(within(firstBrand).getByDisplayValue('12,50'), {
      target: { value: '15,00' },
    })
    fireEvent.change(within(firstBrand).getByLabelText('Quantidade inicial de pacotes'), {
      target: { value: '5' },
    })
    fireEvent.change(idealStock, {
      target: { value: '20' },
    })
    fireEvent.click(screen.getByRole('radio', { name: 'Marca principal 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover marca 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar outra marca' }))

    expect(onBrandChange).toHaveBeenNthCalledWith(1, 'brand-1', { name: 'Açaí' })
    expect(onBrandChange).toHaveBeenNthCalledWith(2, 'brand-1', { packageQuantity: '3' })
    expect(onBrandChange).toHaveBeenNthCalledWith(3, 'brand-1', { packagePrice: '15,00' })
    expect(onBrandChange).toHaveBeenNthCalledWith(4, 'brand-1', { packageCount: '5' })
    expect(onIdealStockChange).toHaveBeenCalledWith('20')
    expect(onPrimaryBrandChange).toHaveBeenCalledWith('brand-2')
    expect(onRemoveBrand).toHaveBeenCalledWith('brand-2')
    expect(onAddBrand).toHaveBeenCalledOnce()
  })

  it('disables removing the only brand and keeps its primary state accessible', () => {
    const onRemoveBrand = vi.fn()
    render(
      <ProductStockControlCard
        {...createProps({
          brands: [brands[0]],
          onRemoveBrand,
          stockControl: 'by-brand',
        })}
      />,
    )

    expect(
      (screen.getByRole('radio', { name: 'Marca principal 1' }) as HTMLInputElement)
        .checked,
    ).toBe(true)
    const removeButton = screen.getByRole('button', { name: 'Remover marca 1' })
    expect((removeButton as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(removeButton)
    expect(onRemoveBrand).not.toHaveBeenCalled()
  })

  it('delegates negative-stock changes and updates the input constraint', () => {
    const onAllowNegativeStockChange = vi.fn()
    const { rerender } = render(
      <ProductStockControlCard {...createProps({ onAllowNegativeStockChange })} />,
    )

    const toggle = screen.getByRole('checkbox', { name: 'Permitir estoque negativo' })
    expect((toggle as HTMLInputElement).checked).toBe(false)
    expect(screen.getByText('Desativado')).not.toBeNull()
    expect(
      (screen.getByRole('spinbutton', { name: 'Estoque inicial' }) as HTMLInputElement)
        .min,
    ).toBe('0')
    fireEvent.click(toggle)
    expect(onAllowNegativeStockChange).toHaveBeenCalledWith(true)

    rerender(
      <ProductStockControlCard
        {...createProps({ allowNegativeStock: true, onAllowNegativeStockChange })}
      />,
    )
    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Permitir estoque negativo',
        }) as HTMLInputElement
      ).checked,
    ).toBe(true)
    expect(
      screen.getByText('Permite registrar saídas acima do saldo disponível'),
    ).not.toBeNull()
    expect(
      (screen.getByRole('spinbutton', { name: 'Estoque inicial' }) as HTMLInputElement)
        .min,
    ).toBe('')
  })

  it('locks by-brand mode for manufacturable products', () => {
    const onStockControlChange = vi.fn()
    render(
      <ProductStockControlCard
        {...createProps({
          categories: [ProductCategory.Manufacturable],
          onStockControlChange,
        })}
      />,
    )

    const singleButton = screen.getByRole('button', { name: 'Estoque único' })
    const byBrandButton = screen.getByRole('button', { name: 'Por marca' })
    expect((singleButton as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true')
    expect((byBrandButton as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(byBrandButton)
    expect(onStockControlChange).not.toHaveBeenCalled()
    fireEvent.click(singleButton)
    expect(onStockControlChange).toHaveBeenCalledWith('single')
    expect(screen.queryByRole('button', { name: 'Adicionar outra marca' })).toBeNull()
  })

  it('announces single-stock field errors with invalid state and descriptions', () => {
    render(
      <ProductStockControlCard
        {...createProps({
          categories: [ProductCategory.Ingredient],
          fieldErrors: {
            currentUnitCost: 'Informe um custo válido.',
            idealStock: 'Informe um estoque ideal válido.',
            initialStock: 'Informe um estoque inicial válido.',
          },
        })}
      />,
    )

    const initialStock = screen.getByRole('spinbutton', { name: /Estoque inicial/ })
    const idealStock = screen.getByRole('spinbutton', { name: /Estoque ideal/ })
    const currentUnitCost = screen.getByRole('spinbutton', {
      name: /Custo unitário atual/,
    })
    expect(initialStock.getAttribute('aria-invalid')).toBe('true')
    expect(initialStock.getAttribute('aria-describedby')).toBe('initial-stock-error')
    expect(idealStock.getAttribute('aria-invalid')).toBe('true')
    expect(idealStock.getAttribute('aria-describedby')).toBe('ideal-stock-error')
    expect(currentUnitCost.getAttribute('aria-invalid')).toBe('true')
    expect(currentUnitCost.getAttribute('aria-describedby')).toBe(
      'current-unit-cost-error',
    )
    expect(screen.getByText('Informe um estoque inicial válido.')).not.toBeNull()
    expect(screen.getByText('Informe um estoque ideal válido.')).not.toBeNull()
    expect(screen.getByText('Informe um custo válido.')).not.toBeNull()
  })

  it('renders brand field errors and the brands-level error through real editors', () => {
    render(
      <ProductStockControlCard
        {...createProps({
          brandErrors: [
            {
              name: 'Informe o nome da marca.',
              packageCount: 'Informe a quantidade inicial.',
              packagePrice: 'Informe o valor da embalagem.',
              packageQuantity: 'Informe a quantidade por embalagem.',
            },
          ],
          brands: [brands[0]],
          fieldErrors: { brands: 'Adicione ao menos uma marca válida.' },
          stockControl: 'by-brand',
        })}
      />,
    )

    const brand = screen.getByRole('group', { name: 'Marca 1' })
    expect(screen.getByRole('alert').textContent).toContain(
      'Adicione ao menos uma marca válida.',
    )
    const fields = [
      ['Frooty', 'brand-0-name-error', 'Informe o nome da marca.'],
      ['2', 'brand-0-package-quantity-error', 'Informe a quantidade por embalagem.'],
      ['12,50', 'brand-0-package-price-error', 'Informe o valor da embalagem.'],
      ['3', 'brand-0-package-count-error', 'Informe a quantidade inicial.'],
    ] as const
    for (const [value, descriptionId, error] of fields) {
      const field = within(brand).getByDisplayValue(value)
      expect(field.getAttribute('aria-invalid')).toBe('true')
      expect(field.getAttribute('aria-describedby')).toBe(descriptionId)
      expect(screen.getByText(error)).not.toBeNull()
    }
  })
})
