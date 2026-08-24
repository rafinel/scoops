import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AccompanimentTypeFaker,
  ProductAccompanimentFaker,
  ProductFaker,
} from '@scoops/core/mrp/domain/entities/fakers'
import { productAccompanimentFormSchema } from '@scoops/validation'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { ProductAccompanimentDialog } from '../index'
import { useProductAccompanimentDialog } from '../use-product-accompaniment-dialog'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route: _route, ...props }: AnchorProps) => (
    <a href={ROUTES[_route]} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('../use-product-accompaniment-dialog', () => ({
  useProductAccompanimentDialog: vi.fn(),
}))

const useProductAccompanimentDialogMock = vi.mocked(useProductAccompanimentDialog)
const candidate = ProductFaker.fake({ id: 'product-2', name: 'Granola', unit: 'g' })
const type = AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' })
const item = {
  ...ProductAccompanimentFaker.fake({
    id: 'link-1',
    accompanimentProductId: candidate.id,
    accompanimentTypeId: type.id,
    quantityPerPortion: 20,
  }),
  accompanimentProductName: candidate.name,
  accompanimentTypeName: type.name,
  unit: 'g' as const,
  brandName: 'Marca atual',
  estimatedCost: 0.45,
}

const createForm = (isEdit = false) => ({
  actionError: null,
  candidates: [candidate],
  candidatesError: false,
  candidatesLoading: false,
  errors: {},
  estimatedCost: 0.45,
  handleSubmit: vi.fn((event: { preventDefault: () => void }) => event.preventDefault()),
  handleValueChange: vi.fn(),
  isEdit,
  isPending: false,
  productIdValue: candidate.id,
  retryCandidates: vi.fn(),
  retrySelectedStock: vi.fn(),
  selectedProduct: candidate,
  selectedStockError: false,
  selectedStockLoading: false,
  source: { name: 'Marca atual', unitCost: 0.45 },
  typeId: type.id,
  types: [{ type, usageCount: 0 }],
  typesError: false,
  typesLoading: false,
  register: vi.fn((name: string) => ({ name })),
})

describe('ProductAccompanimentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProductAccompanimentDialogMock.mockReturnValue(createForm() as never)
  })

  it('renders the linking form with candidate, type and stock context', () => {
    render(
      <ProductAccompanimentDialog
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Vincular acompanhamento' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Acompanhamento' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Tipo' })).toBeTruthy()
    expect(screen.getByLabelText('Marca atual').getAttribute('value')).toBe('Marca atual')
    expect(screen.getByRole('link', { name: 'Gerenciar tipos →' }).textContent).toContain(
      'Gerenciar tipos',
    )
  })

  it('renders the edit mode with the linked product locked', () => {
    useProductAccompanimentDialogMock.mockReturnValue(createForm(true) as never)

    render(
      <ProductAccompanimentDialog
        item={item}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Editar acompanhamento' })).toBeTruthy()
    expect(screen.getByDisplayValue('Granola').getAttribute('disabled')).not.toBeNull()
  })

  it('keeps the quantity contract strict for submitted links', () => {
    const result = productAccompanimentFormSchema.safeParse({
      accompanimentProductId: candidate.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: '0',
    })

    expect(result.success).toBe(false)
  })
})
