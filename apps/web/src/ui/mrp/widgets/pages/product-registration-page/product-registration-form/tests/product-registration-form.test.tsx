import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductRegistrationForm, type ProductRegistrationFormProps } from '..'

const registerMock = vi.fn(() => ({ name: 'field' })) as never

function renderForm(overrides: Partial<ProductRegistrationFormProps> = {}) {
  return render(
    <ProductRegistrationForm
      categories={[]}
      fieldErrors={{}}
      isCategoryDisabled={() => false}
      name='Polpa de açaí'
      onCategoryToggle={vi.fn()}
      onNameChange={vi.fn()}
      onSubmit={vi.fn()}
      onUnitChange={vi.fn()}
      register={registerMock}
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
    expect(ingredientCheckbox.classList.contains('data-checked:bg-blue-700')).toBe(true)
    expect(
      ingredientCheckbox.closest('label')?.classList.contains('border-blue-300'),
    ).toBe(true)
    expect(ingredientCheckbox.closest('label')?.classList.contains('bg-blue-50')).toBe(
      true,
    )
    expect(ingredientCheckbox.closest('label')?.classList.contains('text-blue-700')).toBe(
      true,
    )

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

  it('uses category-specific selected colors for manufacturable choices', () => {
    renderForm({ categories: [ProductCategory.Manufacturable] })

    const manufacturableCheckbox = screen.getByRole('checkbox', {
      name: 'Fabricável',
    })
    expect(manufacturableCheckbox.getAttribute('aria-checked')).toBe('true')
    expect(manufacturableCheckbox.classList.contains('data-checked:bg-violet-700')).toBe(
      true,
    )
    expect(
      manufacturableCheckbox.closest('label')?.classList.contains('border-violet-300'),
    ).toBe(true)
    expect(
      manufacturableCheckbox.closest('label')?.classList.contains('bg-violet-50'),
    ).toBe(true)
    expect(
      manufacturableCheckbox.closest('label')?.classList.contains('text-violet-700'),
    ).toBe(true)
  })
})

function selectOption(option: HTMLElement) {
  fireEvent.pointerDown(option, { button: 0, pointerId: 1 })
  fireEvent.pointerUp(option, { button: 0, pointerId: 1 })
  fireEvent.click(option)
}
