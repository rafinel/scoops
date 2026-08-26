import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDeleteSalesChannelAction } from '@/ui/pdv/hooks/use-delete-sales-channel-action'

import { useDeleteSalesChannelDialog } from '../use-delete-sales-channel-dialog'

import { makeSalesChannel } from '../../tests/sales-channel-test-fixtures'

vi.mock('@/ui/pdv/hooks/use-delete-sales-channel-action', () => ({
  useDeleteSalesChannelAction: vi.fn(),
}))

const useDeleteSalesChannelActionMock = vi.mocked(useDeleteSalesChannelAction)
const channel = makeSalesChannel()

describe('useDeleteSalesChannelDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes once and reports success', async () => {
    const deleteSalesChannel = vi.fn().mockResolvedValue(undefined)
    useDeleteSalesChannelActionMock.mockReturnValue({
      deleteSalesChannel,
      error: null,
      isPending: false,
    })
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useDeleteSalesChannelDialog({ channel, onSuccess }),
    )
    await act(async () => result.current.handleConfirm())
    expect(deleteSalesChannel).toHaveBeenCalledWith('channel-1')
    expect(onSuccess).toHaveBeenCalledWith('Canal excluído com sucesso.')
  })

  it('keeps the confirmation open after a failure', async () => {
    useDeleteSalesChannelActionMock.mockReturnValue({
      deleteSalesChannel: vi.fn().mockRejectedValue(new Error('Falha temporária')),
      error: null,
      isPending: false,
    })
    const { result } = renderHook(() =>
      useDeleteSalesChannelDialog({ channel, onSuccess: vi.fn() }),
    )
    await act(async () => result.current.handleConfirm())
    expect(result.current.actionError).toBe('Falha temporária')
  })
})
