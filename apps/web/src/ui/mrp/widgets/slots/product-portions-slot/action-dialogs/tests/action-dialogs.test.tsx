import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  AccompanimentPortionDetails,
  GlobalAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

import { ROUTES } from '@/constants/routes'
import type { ProductAccompanimentDialogProps } from '@/ui/mrp/widgets/components/product-accompaniment-dialog'
import type { RemoveGlobalAccompanimentDialogProps } from '@/ui/mrp/widgets/components/remove-global-accompaniment-dialog'
import type { RemoveProductAccompanimentDialogProps } from '@/ui/mrp/widgets/components/remove-product-accompaniment-dialog'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { useLinkPortionsDialog } from '../../link-portions-dialog/use-link-portions-dialog'
import { useMakeIndividualDialog } from '../../make-individual-dialog/use-make-individual-dialog'
import { PortionActionDialogs, type PortionActionDialogsProps } from '../index'

vi.mock('@/ui/mrp/widgets/components/product-accompaniment-dialog', () => ({
  ProductAccompanimentDialog: ({
    accompaniment,
    hasIndividualLinks,
    item,
    mode,
    portionName,
    productId,
  }: ProductAccompanimentDialogProps) => (
    <div role='dialog' aria-label='Edição'>
      {`mode=${mode} product=${productId} accompaniment=${accompaniment?.accompanimentProductName} item=${item?.id} portion=${portionName} individual=${hasIndividualLinks}`}
    </div>
  ),
}))
vi.mock('@/ui/mrp/widgets/components/remove-global-accompaniment-dialog', () => ({
  RemoveGlobalAccompanimentDialog: ({
    accompanimentName,
    isScopeLocked,
    item,
    portionName,
    productId,
  }: RemoveGlobalAccompanimentDialogProps) => (
    <div role='alertdialog' aria-label='Remoção global'>
      {`product=${productId} name=${accompanimentName} locked=${isScopeLocked} item=${item?.id} portion=${portionName}`}
    </div>
  ),
}))
vi.mock('@/ui/mrp/widgets/components/remove-product-accompaniment-dialog', () => ({
  RemoveProductAccompanimentDialog: ({
    item,
    portionName,
    productId,
  }: RemoveProductAccompanimentDialogProps) => (
    <div role='alertdialog' aria-label='Remoção individual'>
      {`product=${productId} item=${item.id} portion=${portionName}`}
    </div>
  ),
}))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('../../link-portions-dialog/use-link-portions-dialog', () => ({
  useLinkPortionsDialog: vi.fn(),
}))
vi.mock('../../make-individual-dialog/use-make-individual-dialog', () => ({
  useMakeIndividualDialog: vi.fn(),
}))

const useLinkPortionsDialogMock = vi.mocked(useLinkPortionsDialog)
const useMakeIndividualDialogMock = vi.mocked(useMakeIndividualDialog)

function createLinkState(): ReturnType<typeof useLinkPortionsDialog> {
  return {
    accompanimentName: 'Granola',
    accompanimentPriceError: false,
    accompanimentPriceIsSaved: false,
    accompanimentPriceLoading: false,
    accompanimentPriceSuggestion: 3,
    accompanimentPriceSuggestionMode: 'resale-single',
    actionError: null,
    brandName: 'Mãe Terra',
    candidates: [],
    candidatesError: false,
    candidatesLoading: false,
    canSubmit: false,
    errors: {},
    estimatedCost: 0,
    isPending: false,
    isRefreshing: false,
    numericQuantity: 0,
    portionProductIds: [],
    priceDescribedBy: 'accompaniment-price-help',
    priceRegistration: { name: 'accompanimentPrice' },
    quantityRegistration: { name: 'quantityPerPortion' },
    selectedStockError: false,
    selectedStockLoading: false,
    selectedTypeName: undefined,
    sourceUnitCost: 0,
    submitLabel: 'Vincular porções',
    typeId: '',
    types: [],
    typesError: false,
    typesLoading: false,
    unit: 'g',
    handleSelectedIdsChange: vi.fn(),
    handleSubmit: vi.fn(),
    handleTypeChange: vi.fn(),
    retryAccompanimentPrice: vi.fn(),
    retryCandidates: vi.fn(),
    retrySelectedStock: vi.fn(),
  } as never
}

const globalDetails: GlobalAccompanimentDetails = {
  accompanimentProductId: 'accompaniment-1',
  accompanimentProductName: 'Granola',
  isGlobal: true,
  unit: 'g',
  salePrice: 3,
}
const onBecameGlobalMock = vi.fn()
const row: AccompanimentPortionDetails = {
  id: 'link-1',
  accompanimentProductId: 'accompaniment-1',
  accompanimentProductName: 'Granola',
  accompanimentTypeId: 'type-1',
  accompanimentTypeName: 'Cobertura',
  unit: 'g',
  quantityPerPortion: 50,
  salePrice: 3,
  isGlobal: false,
  hasOtherPortionLinks: false,
  portionProductId: 'portion-9',
  portionProductName: 'Açaí 300 ml',
}

function renderDialogs(overrides: Partial<PortionActionDialogsProps> = {}) {
  return render(
    <PortionActionDialogs
      globalAccompaniment={globalDetails}
      linkedCount={3}
      onBecameGlobal={onBecameGlobalMock}
      onOpenChange={vi.fn()}
      onSuccess={vi.fn()}
      productId='accompaniment-1'
      {...overrides}
    />,
  )
}

describe('PortionActionDialogs', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useLinkPortionsDialogMock.mockReturnValue(createLinkState())
    useMakeIndividualDialogMock.mockReturnValue({
      actionError: null,
      handleConfirm: vi.fn(),
      isPending: false,
    })
  })

  it('renders nothing without a selected action', () => {
    const { container } = renderDialogs()

    expect(container.childElementCount).toBe(0)
  })

  it('opens the Link dialog on the Accompaniment', () => {
    renderDialogs({ selectedAction: { kind: 'link' } })

    expect(screen.getByRole('dialog', { name: 'Vincular porções' })).toBeTruthy()
    expect(useLinkPortionsDialogMock).toHaveBeenCalledWith({
      onBecameGlobal: onBecameGlobalMock,
      onSuccess: expect.any(Function),
      open: true,
      productId: 'accompaniment-1',
    })
  })

  it('opens the Edit dialog in make-global mode with the individual-links flag only when an individual Accompaniment has rows', () => {
    const individual = { ...globalDetails, isGlobal: false }
    const { unmount } = renderDialogs({
      globalAccompaniment: individual,
      selectedAction: { kind: 'make-global' },
    })

    expect(screen.getByRole('dialog', { name: 'Edição' }).textContent).toBe(
      'mode=make-global product=accompaniment-1 accompaniment=Granola item=undefined portion=undefined individual=true',
    )
    unmount()

    renderDialogs({
      globalAccompaniment: individual,
      linkedCount: 0,
      selectedAction: { kind: 'make-global' },
    })
    expect(screen.getByRole('dialog', { name: 'Edição' }).textContent).toBe(
      'mode=make-global product=accompaniment-1 accompaniment=Granola item=undefined portion=undefined individual=false',
    )
  })

  it('opens the Edit dialog in global mode for the page-level Edit', () => {
    renderDialogs({ selectedAction: { kind: 'edit-global' } })

    expect(screen.getByRole('dialog', { name: 'Edição' }).textContent).toBe(
      'mode=global product=accompaniment-1 accompaniment=Granola item=undefined portion=undefined individual=undefined',
    )
  })

  it('opens the Edit dialog for a row with the row Portion id and name', () => {
    renderDialogs({ selectedAction: { item: row, kind: 'edit-row' } })

    expect(screen.getByRole('dialog', { name: 'Edição' }).textContent).toBe(
      'mode=portion-row product=portion-9 accompaniment=undefined item=link-1 portion=Açaí 300 ml individual=undefined',
    )
  })

  it('opens the make-individual confirmation with the Accompaniment name', () => {
    renderDialogs({ selectedAction: { kind: 'make-individual' } })

    expect(
      screen.getByRole('alertdialog', { name: 'Tornar Granola individual?' }),
    ).toBeTruthy()
    expect(useMakeIndividualDialogMock).toHaveBeenCalledWith({
      accompanimentName: 'Granola',
      onOpenChange: expect.any(Function),
      onSuccess: expect.any(Function),
      open: true,
      productId: 'accompaniment-1',
    })
  })

  it('opens the remove-from-all dialog in locked scope for the page-level removal', () => {
    renderDialogs({ selectedAction: { kind: 'remove-global' } })

    expect(screen.getByRole('alertdialog', { name: 'Remoção global' }).textContent).toBe(
      'product=accompaniment-1 name=Granola locked=true item=undefined portion=undefined',
    )
  })

  it('opens the individual removal for an individual row with the Portion id and name', () => {
    renderDialogs({ selectedAction: { item: row, kind: 'remove-row' } })

    expect(
      screen.getByRole('alertdialog', { name: 'Remoção individual' }).textContent,
    ).toBe('product=portion-9 item=link-1 portion=Açaí 300 ml')
    expect(screen.queryByRole('alertdialog', { name: 'Remoção global' })).toBeNull()
  })

  it('opens the scope dialog for a global row with the Portion id and name', () => {
    renderDialogs({
      selectedAction: { item: { ...row, isGlobal: true }, kind: 'remove-row' },
    })

    expect(screen.getByRole('alertdialog', { name: 'Remoção global' }).textContent).toBe(
      'product=portion-9 name=undefined locked=undefined item=link-1 portion=Açaí 300 ml',
    )
    expect(screen.queryByRole('alertdialog', { name: 'Remoção individual' })).toBeNull()
  })
})
