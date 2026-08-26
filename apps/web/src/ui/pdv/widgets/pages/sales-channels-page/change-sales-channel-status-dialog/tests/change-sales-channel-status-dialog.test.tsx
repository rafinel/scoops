import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ChangeSalesChannelStatusDialog } from '..'
import { useChangeSalesChannelStatusDialog } from '../use-change-sales-channel-status-dialog'

import { makeSalesChannel } from '../../tests/sales-channel-test-fixtures'

vi.mock('../use-change-sales-channel-status-dialog', () => ({
  useChangeSalesChannelStatusDialog: vi.fn(),
}))

const useChangeSalesChannelStatusDialogMock = vi.mocked(useChangeSalesChannelStatusDialog)
const channel = makeSalesChannel()

describe('ChangeSalesChannelStatusDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useChangeSalesChannelStatusDialogMock.mockReturnValue({
      actionError: null,
      handleConfirm: vi.fn(),
      isPending: false,
    })
  })

  it('explains the history behavior and delegates cancel/confirm', () => {
    const onOpenChange = vi.fn()
    const handleConfirm = vi.fn()
    useChangeSalesChannelStatusDialogMock.mockReturnValue({
      actionError: null,
      handleConfirm,
      isPending: false,
    })
    render(
      <ChangeSalesChannelStatusDialog
        channel={channel}
        onOpenChange={onOpenChange}
        onSuccess={vi.fn()}
        open
      />,
    )

    expect(
      screen.getByRole('alertdialog', { name: 'Inativar canal?' }).textContent,
    ).toContain('continuarão no histórico')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Inativar canal' }))
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
    expect(handleConfirm).toHaveBeenCalledOnce()
  })

  it('keeps visible inline action failures', () => {
    useChangeSalesChannelStatusDialogMock.mockReturnValue({
      actionError: 'Servidor indisponível',
      handleConfirm: vi.fn(),
      isPending: false,
    })
    render(
      <ChangeSalesChannelStatusDialog
        channel={channel}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
      />,
    )
    expect(screen.getByRole('alert').textContent).toContain('Servidor indisponível')
  })
})
