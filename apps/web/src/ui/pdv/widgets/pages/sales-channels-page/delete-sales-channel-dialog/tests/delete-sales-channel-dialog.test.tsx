import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DeleteSalesChannelDialog } from '..'
import { useDeleteSalesChannelDialog } from '../use-delete-sales-channel-dialog'

import { makeSalesChannel } from '../../tests/sales-channel-test-fixtures'

vi.mock('../use-delete-sales-channel-dialog', () => ({
  useDeleteSalesChannelDialog: vi.fn(),
}))

const useDeleteSalesChannelDialogMock = vi.mocked(useDeleteSalesChannelDialog)
const channel = makeSalesChannel()

describe('DeleteSalesChannelDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useDeleteSalesChannelDialogMock.mockReturnValue({
      actionError: null,
      handleConfirm: vi.fn(),
      isPending: false,
    })
  })

  it('uses a destructive confirmation and preserves history copy', () => {
    const handleConfirm = vi.fn()
    useDeleteSalesChannelDialogMock.mockReturnValue({
      actionError: null,
      handleConfirm,
      isPending: false,
    })
    render(
      <DeleteSalesChannelDialog
        channel={channel}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
      />,
    )
    expect(
      screen.getByRole('alertdialog', { name: 'Excluir canal?' }).textContent,
    ).toContain('continuarão no histórico')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir canal' }))
    expect(handleConfirm).toHaveBeenCalledOnce()
  })

  it('shows a recoverable delete failure', () => {
    useDeleteSalesChannelDialogMock.mockReturnValue({
      actionError: 'Não foi possível excluir.',
      handleConfirm: vi.fn(),
      isPending: false,
    })
    render(
      <DeleteSalesChannelDialog
        channel={channel}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
      />,
    )
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível excluir.')
  })
})
