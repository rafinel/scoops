import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BrandFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductBrandsCard } from '..'
import { useProductBrandsCard } from '../use-product-brands-card'

vi.mock('../use-product-brands-card', () => ({
  useProductBrandsCard: vi.fn(),
}))

const useProductBrandsCardMock = vi.mocked(useProductBrandsCard)

describe('ProductBrandsCard', () => {
  function fakeProps(overrides: Partial<ComponentProps<typeof ProductBrandsCard>> = {}) {
    return {
      brands: [],
      onAddBrand: vi.fn(),
      onDelete: vi.fn(),
      onEdit: vi.fn(),
      onEntry: vi.fn(),
      onSetPrimary: vi.fn(),
      onWriteOff: vi.fn(),
      unit: 'kg' as const,
      ...overrides,
    }
  }

  function fakeBrandStock(
    overrides: {
      brand?: Parameters<typeof BrandFaker.fake>[0]
      stockQuantity?: number
      unitPrice?: number
    } = {},
  ): ProductBrandStock {
    return {
      brand: BrandFaker.fake({
        id: 'brand-1',
        name: 'Marca principal',
        productId: 'product-1',
        ...overrides.brand,
      }),
      stockQuantity: overrides.stockQuantity ?? 10,
      unitPrice: overrides.unitPrice ?? 4,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useProductBrandsCardMock.mockReturnValue({ rows: [] })
  })

  afterEach(cleanup)

  it('renders the empty state and delegates both add-brand actions', () => {
    const onAddBrand = vi.fn()

    render(<ProductBrandsCard {...fakeProps({ onAddBrand })} />)

    expect(screen.getByRole('heading', { name: /Marcas \(0\)/ })).not.toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Nenhuma marca cadastrada' }),
    ).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar marca' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar primeira marca' }))

    expect(onAddBrand).toHaveBeenCalledTimes(2)
  })

  it('renders responsive brand stock content with localized values and primary badges', () => {
    const primaryBrand = fakeBrandStock({
      brand: { isPrimary: true, name: 'Marca principal', packagePrice: 12.5 },
      stockQuantity: 9,
      unitPrice: 6.25,
    })
    const alternateBrand = fakeBrandStock({
      brand: {
        id: 'brand-2',
        isPrimary: false,
        name: 'Marca alternativa',
        packageQuantity: 1.5,
      },
      stockQuantity: 2.75,
      unitPrice: 4.2,
    })
    const onEntry = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()
    const onWriteOff = vi.fn()
    const onSetPrimary = vi.fn()
    useProductBrandsCardMock.mockReturnValue({
      rows: [
        {
          ...primaryBrand,
          formattedPackagePrice: 'R$ 12,50',
          formattedPackageQuantity: '2 kg',
          formattedStockQuantity: '9 kg',
          formattedUnitPrice: 'R$ 6,25 / kg',
        },
        {
          ...alternateBrand,
          formattedPackagePrice: 'R$ 8,00',
          formattedPackageQuantity: '1,5 kg',
          formattedStockQuantity: '2,75 kg',
          formattedUnitPrice: 'R$ 4,20 / kg',
        },
      ],
    })

    render(
      <ProductBrandsCard
        {...fakeProps({ onDelete, onEdit, onEntry, onSetPrimary, onWriteOff })}
      />,
    )

    expect(screen.getByRole('heading', { name: /Marcas \(2\)/ })).not.toBeNull()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByRole('table')).not.toBeNull()
    expect(screen.getAllByText('Principal')).toHaveLength(2)
    expect(screen.getAllByText('Marca principal')).toHaveLength(2)
    expect(screen.getAllByText('Marca alternativa')).toHaveLength(2)
    expect(screen.getAllByText(/R\$\s*12,50/)).toHaveLength(2)
    expect(screen.getAllByText('1,5 kg')).toHaveLength(2)
    expect(screen.getAllByText('2,75 kg')).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: 'Entrada de estoque' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: 'Baixa de estoque' })[0])

    expect(onEntry).toHaveBeenCalledWith(
      expect.objectContaining({ brand: primaryBrand.brand }),
    )
    expect(onWriteOff).toHaveBeenCalledWith(
      expect.objectContaining({ brand: primaryBrand.brand }),
    )

    const alternateMenuName = 'Abrir ações da marca Marca alternativa'
    fireEvent.click(screen.getAllByRole('button', { name: alternateMenuName })[0])
    fireEvent.click(screen.getByRole('menuitem', { name: 'Editar marca' }))
    fireEvent.click(screen.getAllByRole('button', { name: alternateMenuName })[0])
    fireEvent.click(screen.getByRole('menuitem', { name: 'Definir como principal' }))
    fireEvent.click(screen.getAllByRole('button', { name: alternateMenuName })[0])
    fireEvent.click(screen.getByRole('menuitem', { name: 'Excluir marca' }))

    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ brand: alternateBrand.brand }),
    )
    expect(onSetPrimary).toHaveBeenCalledWith(
      expect.objectContaining({ brand: alternateBrand.brand }),
    )
    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({ brand: alternateBrand.brand }),
    )
  })
})
