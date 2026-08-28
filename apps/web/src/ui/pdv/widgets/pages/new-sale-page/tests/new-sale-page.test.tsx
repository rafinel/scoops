import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NewSalePage } from '..'
import { useNewSalePage } from '../use-new-sale-page'

vi.mock('../use-new-sale-page', () => ({ useNewSalePage: vi.fn() }))
vi.mock('../new-sale-catalog', () => ({
  NewSaleCatalog: () => <div>Catálogo da venda</div>,
}))
vi.mock('../new-sale-cart', () => ({
  NewSaleCart: () => <div>Carrinho da venda</div>,
}))
vi.mock('../portion-configuration-dialog', () => ({
  PortionConfigurationDialog: () => null,
}))
vi.mock('../resale-configuration-dialog', () => ({
  ResaleConfigurationDialog: () => null,
}))
vi.mock('../order-registration-dialog', () => ({
  OrderRegistrationDialog: () => null,
}))
vi.mock('../order-confirmation', () => ({
  OrderConfirmation: () => <div>Confirmação da venda</div>,
}))
vi.mock('../order-verification-state', () => ({
  OrderVerificationState: ({ isVisible }: { isVisible: boolean }) =>
    isVisible ? (
      <div aria-label='Verificando registro' role='status'>
        Verificando registro
      </div>
    ) : null,
}))

const useNewSalePageMock = vi.mocked(useNewSalePage)

function pageState() {
  const handler = vi.fn()
  return {
    activeSalesChannels: [],
    catalogProducts: [],
    channelId: undefined,
    editingLine: undefined,
    handleChannelChange: handler,
    handleClear: handler,
    handleConfirmRegistration: handler,
    handleDialogOpenChange: handler,
    handleEditLine: handler,
    handleFeedbackAction: handler,
    handleNewSale: handler,
    handleRefreshPreview: handler,
    handleRegister: handler,
    handleRemoveLine: handler,
    handleRetryRegistration: handler,
    handleSaveLine: handler,
    handleSelectProduct: handler,
    handleQuantityChange: handler,
    idempotencyKey: undefined,
    isActiveSalesChannelsError: false,
    isLoadingActiveSalesChannels: false,
    isPreviewPending: false,
    isRegistrationOpen: false,
    isRegistrationPending: false,
    isVerification: false,
    lineInputs: [],
    previewCart: undefined,
    previewError: undefined,
    previewToken: undefined,
    registeredOrder: undefined,
    registrationError: undefined,
    registrationFeedback: undefined,
    registrationResult: undefined,
    selectedProduct: undefined,
  }
}

describe('NewSalePage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('keeps the exact catalog and cart composition on the authenticated page', () => {
    useNewSalePageMock.mockReturnValue(pageState() as never)

    render(<NewSalePage />)

    expect(screen.getByRole('heading', { name: 'Nova venda' })).toBeTruthy()
    expect(screen.getByText('Catálogo da venda')).toBeTruthy()
    expect(screen.getByText('Carrinho da venda')).toBeTruthy()
    expect(screen.queryByText(/Produtos com selo Adicionado/)).toBeNull()
  })

  it.each([
    ['repriced', 'O pedido foi atualizado', 'Revisar valores'],
    ['review-required', 'Revise o pedido', 'Revisar pedido'],
    ['correction-required', 'Corrija o pedido', 'Revisar itens'],
  ] as const)('renders the %s server outcome accessibly', (kind, heading, actionName) => {
    useNewSalePageMock.mockReturnValue({
      ...pageState(),
      registrationResult:
        kind === 'repriced'
          ? {
              kind,
              recalculatedCart: {
                establishmentId: 'establishment-1',
                lines: [],
                discounts: [],
                subtotal: 20,
                totalDiscount: 0,
                total: 20,
              },
              previewToken: 'fresh-preview-token',
              changes: [
                {
                  kind: 'channel',
                  previous: { label: 'Canal anterior', amount: 20 },
                  current: { label: 'Canal atual', amount: 22 },
                },
              ],
            }
          : kind === 'review-required'
            ? {
                kind,
                shortages: [
                  {
                    productId: 'product-1',
                    productName: 'Pote pronto',
                    requiredQuantity: 2,
                    availableQuantity: 1,
                    unit: 'un.',
                  },
                ],
                changes: [],
              }
            : {
                kind,
                invalidConfigurations: [
                  {
                    productId: 'product-1',
                    productName: 'Pote pronto',
                    selectedKind: 'resale',
                    selectedId: 'brand-1',
                    reason: 'unavailable',
                    correctiveMessage: 'Escolha outra marca disponível.',
                  },
                ],
                shortages: [],
                changes: [],
              },
    } as never)

    render(<NewSalePage />)

    const dialog = screen.getByRole('dialog', { name: heading })
    expect(dialog).toBeTruthy()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.queryByRole('status')).toBeNull()
    const actionButton = screen.getByRole('button', { name: actionName })
    actionButton.focus()
    expect(document.activeElement).toBe(actionButton)
  })

  it('renders rollback assurance only for a confirmed rollback and keeps unknown transport neutral', () => {
    useNewSalePageMock.mockReturnValue({
      ...pageState(),
      registrationFeedback: 'rollback',
    } as never)
    const { rerender } = render(<NewSalePage />)

    expect(
      screen.getByRole('dialog', { name: 'Não foi possível registrar' }),
    ).toBeTruthy()
    expect(screen.getByText('Nenhuma alteração foi realizada')).toBeTruthy()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    const rollbackAction = screen.getByRole('button', { name: 'Voltar ao pedido' })
    rollbackAction.focus()
    expect(document.activeElement).toBe(rollbackAction)

    useNewSalePageMock.mockReturnValue({
      ...pageState(),
      isVerification: true,
    } as never)
    rerender(<NewSalePage />)

    expect(screen.getByRole('status', { name: 'Verificando registro' })).toBeTruthy()
    expect(screen.queryByText('Nenhuma alteração foi realizada')).toBeNull()
  })
})
