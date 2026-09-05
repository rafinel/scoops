import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductBrandEditor, type ProductBrandEditorProps } from '..'

const brand = {
  id: 'brand-1',
  name: 'Frooty',
  unit: 'kg' as const,
  packageQuantity: '2',
  packagePrice: '12,50',
  packageCount: '3',
  isPrimary: true,
}

function renderEditor(overrides: Partial<ProductBrandEditorProps> = {}) {
  return render(
    <ProductBrandEditor
      allowNegativeStock={false}
      brand={brand}
      canRemove
      index={0}
      onChange={vi.fn()}
      onPrimaryChange={vi.fn()}
      onRemove={vi.fn()}
      {...overrides}
    />,
  )
}

describe('ProductBrandEditor', () => {
  afterEach(cleanup)

  it('delegates changes from the name and package fields', () => {
    const onChange = vi.fn()
    renderEditor({ onChange })

    const fields = [
      ['Frooty', { name: 'Açaí' }],
      ['2', { packageQuantity: '2,5' }],
      ['12,50', { packagePrice: '15,00' }],
      ['3', { packageCount: '4' }],
    ] as const

    for (const [index, [value, changes]] of fields.entries()) {
      const field = screen.getByDisplayValue(value)
      expect((field as HTMLInputElement).value).toBe(value)
      fireEvent.change(field, { target: { value: Object.values(changes)[0] } })
      expect(onChange).toHaveBeenNthCalledWith(index + 1, changes)
    }
  })

  it('renders the selected primary radio and delegates selecting another brand', () => {
    const onPrimaryChange = vi.fn()
    renderEditor({
      brand: { ...brand, isPrimary: false },
      index: 1,
      onPrimaryChange,
    })

    const primaryRadio = screen.getByRole('radio', { name: 'Marca principal 2' })
    expect((primaryRadio as HTMLInputElement).checked).toBe(false)
    fireEvent.click(primaryRadio)
    expect(onPrimaryChange).toHaveBeenCalledOnce()
  })

  it('allows removal only when the parent has multiple brands', () => {
    const onRemove = vi.fn()
    const { rerender } = renderEditor({ onRemove })

    const removeButton = screen.getByRole('button', { name: 'Remover marca 1' })
    expect((removeButton as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(removeButton)
    expect(onRemove).toHaveBeenCalledOnce()

    rerender(
      <ProductBrandEditor
        allowNegativeStock={false}
        brand={brand}
        canRemove={false}
        index={0}
        onChange={vi.fn()}
        onPrimaryChange={vi.fn()}
        onRemove={onRemove}
      />,
    )
    expect(
      (screen.getByRole('button', { name: 'Remover marca 1' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Remover marca 1' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('requires non-negative initial packages when negative stock is disabled', () => {
    renderEditor({ allowNegativeStock: false })

    const packageQuantity = screen.getByDisplayValue('2')
    const packageCount = screen.getByDisplayValue('3')
    expect(packageQuantity.getAttribute('min')).toBe('0')
    expect(packageQuantity.getAttribute('inputmode')).toBe('decimal')
    expect(packageCount.getAttribute('min')).toBe('0')
    expect(packageCount.getAttribute('inputmode')).toBe('decimal')
  })

  it('allows negative initial packages when negative stock is enabled', () => {
    renderEditor({ allowNegativeStock: true })

    const packageCount = screen.getByDisplayValue('3')
    expect(packageCount.getAttribute('min')).toBeNull()
    expect((packageCount as HTMLInputElement).value).toBe('3')
  })

  it('exposes validation errors and their controls through describedby', () => {
    renderEditor({
      errors: {
        name: 'Informe o nome da marca.',
        packageCount: 'Informe uma quantidade inicial válida.',
        packagePrice: 'Informe um valor válido.',
        packageQuantity: 'Informe uma quantidade por embalagem válida.',
      },
      index: 2,
    })

    const fields = [
      ['Nome da marca', 'brand-2-name-error', 'Informe o nome da marca.'],
      [
        'Qtd. por embalagem',
        'brand-2-package-quantity-error',
        'Informe uma quantidade por embalagem válida.',
      ],
      ['Valor por embalagem', 'brand-2-package-price-error', 'Informe um valor válido.'],
      [
        'Quantidade inicial de pacotes',
        'brand-2-package-count-error',
        'Informe uma quantidade inicial válida.',
      ],
    ] as const

    for (const [label, errorId, message] of fields) {
      const field = screen.getByDisplayValue(
        label === 'Nome da marca'
          ? 'Frooty'
          : label === 'Qtd. por embalagem'
            ? '2'
            : label === 'Valor por embalagem'
              ? '12,50'
              : '3',
      )
      expect(field.getAttribute('aria-invalid')).toBe('true')
      expect(field.getAttribute('aria-describedby')).toBe(errorId)
      expect(screen.getByText(message)).not.toBeNull()
    }
  })
})
