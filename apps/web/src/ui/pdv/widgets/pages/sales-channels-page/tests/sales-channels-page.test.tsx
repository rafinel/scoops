import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SalesChannelsPage } from '..'
import { useSalesChannelsPage } from '../use-sales-channels-page'

import { makeSalesChannel } from './sales-channel-test-fixtures'

vi.mock('../use-sales-channels-page', () => ({ useSalesChannelsPage: vi.fn() }))
vi.mock('../sales-channel-dialog', () => ({
  SalesChannelDialog: () => <div data-testid='sales-channel-dialog' />,
}))
vi.mock('../change-sales-channel-status-dialog', () => ({
  ChangeSalesChannelStatusDialog: () => (
    <div data-testid='change-sales-channel-status-dialog' />
  ),
}))
vi.mock('../delete-sales-channel-dialog', () => ({
  DeleteSalesChannelDialog: () => <div data-testid='delete-sales-channel-dialog' />,
}))

const useSalesChannelsPageMock = vi.mocked(useSalesChannelsPage)
const channel = makeSalesChannel()
const pageProps = {
  adjustmentFilter: undefined,
  onAdjustmentFilterChange: vi.fn(),
}

function createView() {
  return {
    actionError: null,
    announcement: '',
    isLoadingSalesChannels: false,
    isReactivating: false,
    isSalesChannelsError: false,
    handleCreate: vi.fn(),
    handleDelete: vi.fn(),
    handleEdit: vi.fn(),
    handleInactivate: vi.fn(),
    handleOpenChange: vi.fn(),
    handleRetry: vi.fn(),
    handleStatusChange: vi.fn(),
    handleSuccess: vi.fn(),
    salesChannels: [],
    selectedAction: undefined,
  }
}

describe('SalesChannelsPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useSalesChannelsPageMock.mockReturnValue(createView())
  })

  it('renders the page shell and starts create from the primary action', () => {
    render(<SalesChannelsPage {...pageProps} />)

    expect(screen.getByRole('heading', { name: 'Canais de venda' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Nenhum canal cadastrado' })).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Novo canal' })[0])
    expect(
      useSalesChannelsPageMock.mock.results[0].value.handleCreate,
    ).toHaveBeenCalledOnce()
  })

  it('composes loading, retryable error and populated states', () => {
    useSalesChannelsPageMock.mockReturnValue({
      ...createView(),
      isLoadingSalesChannels: true,
    })
    const { rerender } = render(<SalesChannelsPage {...pageProps} />)
    expect(
      screen.getByRole('status', { name: 'Carregando canais de venda' }),
    ).toBeTruthy()

    const handleRetry = vi.fn()
    useSalesChannelsPageMock.mockReturnValue({
      ...createView(),
      handleRetry,
      isSalesChannelsError: true,
    })
    rerender(<SalesChannelsPage {...pageProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(handleRetry).toHaveBeenCalledOnce()

    useSalesChannelsPageMock.mockReturnValue({
      ...createView(),
      salesChannels: [channel],
    })
    rerender(<SalesChannelsPage {...pageProps} />)
    expect(screen.getAllByText('Delivery próprio')).toHaveLength(2)
    expect(screen.getAllByText('+12,00%')).toHaveLength(2)
    expect(screen.getAllByText('Ativo')).toHaveLength(2)
  })

  it('renders action errors and opens the selected dialog boundary', () => {
    useSalesChannelsPageMock.mockReturnValue({
      ...createView(),
      actionError: 'Não foi possível reativar o canal.',
      selectedAction: { channel, kind: 'inactivate' },
    })
    render(<SalesChannelsPage {...pageProps} />)

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível reativar o canal.',
    )
    expect(screen.getByTestId('change-sales-channel-status-dialog')).toBeTruthy()
  })
})
