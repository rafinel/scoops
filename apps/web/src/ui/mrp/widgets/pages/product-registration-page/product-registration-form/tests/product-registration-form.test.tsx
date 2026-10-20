import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductRegistrationForm, type ProductRegistrationFormProps } from '..'

const registerMock = vi.fn(() => ({ name: 'field' })) as never

function renderForm(overrides: Partial<ProductRegistrationFormProps> = {}) {
  return render(
    <ProductRegistrationForm
      accompanimentPrice=''
      categories={[]}
      fieldErrors={{}}
      isAccompanimentPriceVisible={false}
      isCategoryDisabled={() => false}
      isResalePriceVisible={false}
      name='Polpa de açaí'
      onAccompanimentPriceChange={vi.fn()}
      onCategoryToggle={vi.fn()}
      onNameChange={vi.fn()}
      onResalePriceChange={vi.fn()}
      onSubmit={vi.fn()}
      onUnitChange={vi.fn()}
      register={registerMock}
      resalePrice=''
      unit='un'
      {...overrides}
    >
      <div>stock card</div>
    </ProductRegistrationForm>,
  )
}

describe('ProductRegistrationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(cleanup)

  it('delegates name, unit, and submit interactions', () => {
    const onNameChange = vi.fn()
    const onUnitChange = vi.fn()
    const onSubmit = vi.fn()
    renderForm({ onNameChange, onSubmit, onUnitChange })

    const name = screen.getByRole('textbox', { name: 'Nome' })
    expect((name as HTMLInputElement).value).toBe('Polpa de açaí')
    expect(registerMock).toHaveBeenCalledWith('name')
    fireEvent.change(name, { target: { value: 'Açaí com banana' } })
    expect(onNameChange).toHaveBeenCalledWith('Açaí com banana')

    const unit = screen.getByRole('combobox', { name: 'Unidade' })
    expect(unit.textContent).toContain('un')
    fireEvent.click(unit)
    selectOption(screen.getByRole('option', { name: 'Quilogramas (kg)' }))
    expect(onUnitChange).toHaveBeenCalledWith('kg')

    const form = name.closest('form')
    if (!form) throw new Error('Missing product registration form')
    fireEvent.submit(form)
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0]?.[0].target).toBe(form)
  })

  it('renders all categories and delegates each enabled category toggle', () => {
    const onCategoryToggle = vi.fn()
    renderForm({ onCategoryToggle })

    const categories = [
      [ProductCategory.Ingredient, 'Ingrediente'],
      [ProductCategory.Manufacturable, 'Fabricável'],
      [ProductCategory.Portion, 'Porção'],
      [ProductCategory.Resale, 'Revenda'],
      [ProductCategory.Accompaniment, 'Acompanhamento'],
    ] as const

    for (const [, label] of categories) {
      expect(
        screen.getByRole('checkbox', { name: label }).getAttribute('aria-checked'),
      ).toBe('false')
      fireEvent.click(screen.getByRole('checkbox', { name: label }))
    }

    expect(onCategoryToggle.mock.calls.map(([category]) => category)).toEqual(
      categories.map(([category]) => category),
    )
    expect(screen.getByText('stock card')).not.toBeNull()
  })

  it('marks selected and disabled categories and explains incompatible choices', () => {
    const onCategoryToggle = vi.fn()
    const isCategoryDisabled = (category: ProductCategory) =>
      category === ProductCategory.Resale || category === ProductCategory.Accompaniment
    renderForm({
      categories: [ProductCategory.Ingredient, ProductCategory.Portion],
      isCategoryDisabled,
      onCategoryToggle,
    })

    const ingredientCheckbox = screen.getByRole('checkbox', { name: 'Ingrediente' })
    expect(ingredientCheckbox.getAttribute('aria-checked')).toBe('true')
    expect(
      ingredientCheckbox.classList.contains('data-checked:bg-category-ingredient'),
    ).toBe(true)
    expect(
      ingredientCheckbox
        .closest('label')
        ?.classList.contains('border-category-ingredient-border'),
    ).toBe(true)
    expect(
      ingredientCheckbox
        .closest('label')
        ?.classList.contains('bg-category-ingredient-bg'),
    ).toBe(true)
    expect(
      ingredientCheckbox.closest('label')?.classList.contains('text-category-ingredient'),
    ).toBe(true)

    const portionCheckbox = screen.getByRole('checkbox', { name: 'Porção' })
    expect(portionCheckbox.getAttribute('aria-checked')).toBe('true')
    expect(portionCheckbox.getAttribute('data-disabled')).toBeNull()

    const resaleCheckbox = screen.getByRole('checkbox', { name: 'Revenda' })
    expect(resaleCheckbox.getAttribute('aria-checked')).toBe('false')
    expect(resaleCheckbox.getAttribute('data-disabled')).toBe('')

    const accompanimentCheckbox = screen.getByRole('checkbox', {
      name: 'Acompanhamento',
    })
    expect(accompanimentCheckbox.getAttribute('data-disabled')).toBe('')
    fireEvent.click(resaleCheckbox)
    fireEvent.click(accompanimentCheckbox)
    expect(onCategoryToggle).not.toHaveBeenCalled()
    expect(
      screen.getByText('Porção e Revenda não podem ser selecionadas juntas.'),
    ).not.toBeNull()
  })

  it('reports name and category validation errors through the form controls', () => {
    renderForm({
      fieldErrors: {
        categories: 'Selecione ao menos uma categoria.',
        name: 'Informe o nome do produto.',
      },
    })

    const name = screen.getByDisplayValue('Polpa de açaí')
    expect(name.getAttribute('aria-invalid')).toBe('true')
    expect(name.getAttribute('aria-describedby')).toBe('product-name-error')
    expect(screen.getByText('Informe o nome do produto.')).not.toBeNull()

    const categoryGroup = screen.getByRole('group', { name: 'Categorias' })
    expect(categoryGroup.getAttribute('aria-invalid')).toBe('true')
    expect(categoryGroup.getAttribute('aria-describedby')).toBe(
      'product-categories-error',
    )
    expect(screen.getByRole('alert').textContent).toContain(
      'Selecione ao menos uma categoria.',
    )
  })

  describe('sale prices', () => {
    it('renders no price row when neither price field is visible', () => {
      renderForm()

      expect(screen.queryByRole('textbox', { name: 'Preço de revenda' })).toBeNull()
      expect(
        screen.queryByRole('textbox', { name: 'Preço como acompanhamento' }),
      ).toBeNull()
      expect(screen.queryByText(/Opcional\. Sem preço/)).toBeNull()
    })

    it('renders the Resale price after the categories and delegates its changes', () => {
      const onResalePriceChange = vi.fn()
      renderForm({
        categories: [ProductCategory.Resale],
        isResalePriceVisible: true,
        onResalePriceChange,
        resalePrice: '12,50',
      })

      const resalePrice = screen.getByRole('textbox', {
        name: 'Preço de revenda',
      }) as HTMLInputElement
      expect(resalePrice.value).toBe('12,50')
      expect(resalePrice.placeholder).toBe('0,00')
      expect(resalePrice.getAttribute('inputmode')).toBe('decimal')
      expect(resalePrice.getAttribute('aria-invalid')).toBe('false')
      expect(registerMock).toHaveBeenCalledWith('resalePrice')
      expect(
        screen.queryByRole('textbox', { name: 'Preço como acompanhamento' }),
      ).toBeNull()

      expectDocumentOrder([
        screen.getByRole('textbox', { name: 'Nome' }),
        screen.getByRole('combobox', { name: 'Unidade' }),
        screen.getByRole('group', { name: 'Categorias' }),
        resalePrice,
      ])

      fireEvent.change(resalePrice, { target: { value: '15,00' } })
      expect(onResalePriceChange).toHaveBeenCalledWith('15,00')
    })

    it('renders both prices in tab order after the categories with independent values and handlers', () => {
      const onAccompanimentPriceChange = vi.fn()
      const onResalePriceChange = vi.fn()
      renderForm({
        accompanimentPrice: '',
        categories: [ProductCategory.Resale, ProductCategory.Accompaniment],
        isAccompanimentPriceVisible: true,
        isResalePriceVisible: true,
        onAccompanimentPriceChange,
        onResalePriceChange,
        resalePrice: '12,00',
      })

      const resalePrice = screen.getByRole('textbox', {
        name: 'Preço de revenda',
      }) as HTMLInputElement
      const accompanimentPrice = screen.getByRole('textbox', {
        name: 'Preço como acompanhamento',
      }) as HTMLInputElement
      expect(resalePrice.value).toBe('12,00')
      expect(accompanimentPrice.value).toBe('')
      expect(registerMock).toHaveBeenCalledWith('accompanimentPrice')
      expect(screen.queryByText(/Usar preço de revenda/)).toBeNull()

      expectDocumentOrder([
        screen.getByRole('textbox', { name: 'Nome' }),
        screen.getByRole('combobox', { name: 'Unidade' }),
        screen.getByRole('checkbox', { name: 'Ingrediente' }),
        resalePrice,
        accompanimentPrice,
      ])

      fireEvent.change(accompanimentPrice, { target: { value: '9,00' } })
      expect(onAccompanimentPriceChange).toHaveBeenCalledWith('9,00')
      expect(onResalePriceChange).not.toHaveBeenCalled()
    })

    it('shows the optional hint with each price and describes the input by it', () => {
      renderForm({
        isAccompanimentPriceVisible: true,
        isResalePriceVisible: true,
      })

      expect(
        screen.getAllByText('Opcional. Sem preço, o produto fica indisponível no PDV.'),
      ).toHaveLength(2)
      expect(
        screen
          .getByRole('textbox', { name: 'Preço de revenda' })
          .getAttribute('aria-describedby'),
      ).toBe('resale-price-hint')
      expect(
        screen
          .getByRole('textbox', { name: 'Preço como acompanhamento' })
          .getAttribute('aria-describedby'),
      ).toBe('accompaniment-price-hint')
    })

    it('reports price validation errors beside each visible price field', () => {
      renderForm({
        fieldErrors: {
          accompanimentPrice:
            'Informe um preço maior ou igual a zero, com até duas casas decimais.',
          resalePrice:
            'Informe um preço de revenda maior ou igual a zero, com até duas casas decimais.',
        },
        isAccompanimentPriceVisible: true,
        isResalePriceVisible: true,
      })

      const resalePrice = screen.getByRole('textbox', { name: 'Preço de revenda' })
      expect(resalePrice.getAttribute('aria-invalid')).toBe('true')
      expect(resalePrice.getAttribute('aria-describedby')).toBe(
        'resale-price-hint resale-price-error',
      )
      expect(
        screen.getByText(
          'Informe um preço de revenda maior ou igual a zero, com até duas casas decimais.',
        ).id,
      ).toBe('resale-price-error')

      const accompanimentPrice = screen.getByRole('textbox', {
        name: 'Preço como acompanhamento',
      })
      expect(accompanimentPrice.getAttribute('aria-invalid')).toBe('true')
      expect(accompanimentPrice.getAttribute('aria-describedby')).toBe(
        'accompaniment-price-hint accompaniment-price-error',
      )
      expect(
        screen.getByText(
          'Informe um preço maior ou igual a zero, com até duas casas decimais.',
        ).id,
      ).toBe('accompaniment-price-error')
    })
  })

  it('uses category-specific selected colors for manufacturable choices', () => {
    renderForm({ categories: [ProductCategory.Manufacturable] })

    const manufacturableCheckbox = screen.getByRole('checkbox', {
      name: 'Fabricável',
    })
    expect(manufacturableCheckbox.getAttribute('aria-checked')).toBe('true')
    expect(
      manufacturableCheckbox.classList.contains(
        'data-checked:bg-category-manufacturable',
      ),
    ).toBe(true)
    expect(
      manufacturableCheckbox
        .closest('label')
        ?.classList.contains('border-category-manufacturable-border'),
    ).toBe(true)
    expect(
      manufacturableCheckbox
        .closest('label')
        ?.classList.contains('bg-category-manufacturable-bg'),
    ).toBe(true)
    expect(
      manufacturableCheckbox
        .closest('label')
        ?.classList.contains('text-category-manufacturable'),
    ).toBe(true)
  })
})

function expectDocumentOrder(elements: Element[]) {
  for (const [index, element] of elements.slice(0, -1).entries()) {
    const next = elements[index + 1] as Element
    expect(
      Boolean(element.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true)
  }
}

function selectOption(option: HTMLElement) {
  fireEvent.pointerDown(option, { button: 0, pointerId: 1 })
  fireEvent.pointerUp(option, { button: 0, pointerId: 1 })
  fireEvent.click(option)
}
