import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BrandFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductBrandActionsMenu } from '..'

describe('ProductBrandActionsMenu', () => {
  function fakeBrandStock(isPrimary: boolean): ProductBrandStock {
    return {
      brand: BrandFaker.fake({
        id: 'brand-1',
        isPrimary,
        name: 'Frooty',
        productId: 'product-1',
      }),
      stockQuantity: 10,
      unitPrice: 4,
    }
  }

  afterEach(cleanup)

  it('exposes edit, set-primary and delete actions for a non-primary brand', () => {
    const brand = fakeBrandStock(false)
    const onDelete = vi.fn()
    const onEdit = vi.fn()
    const onSetPrimary = vi.fn()

    render(
      <ProductBrandActionsMenu
        brand={brand}
        onDelete={onDelete}
        onEdit={onEdit}
        onSetPrimary={onSetPrimary}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Abrir ações da marca Frooty' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Editar marca' }))
    expect(onEdit).toHaveBeenCalledWith(brand)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir ações da marca Frooty' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Definir como principal' }))
    expect(onSetPrimary).toHaveBeenCalledWith(brand)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir ações da marca Frooty' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Excluir marca' }))
    expect(onDelete).toHaveBeenCalledWith(brand)
  })

  it('hides set-primary for the current primary brand and disables the trigger when requested', () => {
    const brand = fakeBrandStock(true)
    const onDelete = vi.fn()
    const onEdit = vi.fn()
    const onSetPrimary = vi.fn()

    const { rerender } = render(
      <ProductBrandActionsMenu
        brand={brand}
        onDelete={onDelete}
        onEdit={onEdit}
        onSetPrimary={onSetPrimary}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Abrir ações da marca Frooty' }))
    expect(screen.queryByRole('menuitem', { name: 'Definir como principal' })).toBeNull()
    expect(screen.getByRole('menuitem', { name: 'Editar marca' })).not.toBeNull()
    expect(screen.getByRole('menuitem', { name: 'Excluir marca' })).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir ações da marca Frooty' }))

    rerender(
      <ProductBrandActionsMenu
        brand={brand}
        disabled
        onDelete={onDelete}
        onEdit={onEdit}
        onSetPrimary={onSetPrimary}
      />,
    )

    const trigger = screen.getByRole('button', {
      name: 'Abrir ações da marca Frooty',
    }) as HTMLButtonElement
    expect(trigger.disabled).toBe(true)
    fireEvent.click(trigger)
    expect(screen.queryByRole('menuitem', { name: 'Editar marca' })).toBeNull()
  })
})
