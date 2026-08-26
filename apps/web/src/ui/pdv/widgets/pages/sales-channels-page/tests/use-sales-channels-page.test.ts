import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useReactivateSalesChannelAction } from '@/ui/pdv/hooks/use-reactivate-sales-channel-action'
import { useSalesChannelsQuery } from '@/ui/pdv/hooks/use-sales-channels-query'

import { useSalesChannelsPage } from '../use-sales-channels-page'

import { makeSalesChannel } from './sales-channel-test-fixtures'

vi.mock('@/ui/pdv/hooks/use-reactivate-sales-channel-action', () => ({
  useReactivateSalesChannelAction: vi.fn(),
}))
vi.mock('@/ui/pdv/hooks/use-sales-channels-query', () => ({
  useSalesChannelsQuery: vi.fn(),
}))

const useReactivateSalesChannelActionMock = vi.mocked(useReactivateSalesChannelAction)
const useSalesChannelsQueryMock = vi.mocked(useSalesChannelsQuery)
const channel = makeSalesChannel({
  id: 'inactive-1',
  name: 'Balcão',
  status: 'inactive',
})

describe('useSalesChannelsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSalesChannelsQueryMock.mockReturnValue({
      isLoadingSalesChannels: false,
      isSalesChannelsError: false,
      refetchSalesChannels: vi.fn().mockResolvedValue(undefined),
      salesChannels: [channel],
      salesChannelsError: null,
    })
  })

  it('coordinates selection, retry and successful reactivation', async () => {
    const reactivateSalesChannel = vi.fn().mockResolvedValue(channel)
    useReactivateSalesChannelActionMock.mockReturnValue({
      error: null,
      isPending: false,
      reactivateSalesChannel,
    })
    const { result } = renderHook(() => useSalesChannelsPage())

    act(() => result.current.handleEdit(channel))
    expect(result.current.selectedAction).toEqual({ channel, kind: 'edit' })
    act(() => result.current.handleOpenChange(false))
    expect(result.current.selectedAction).toBeUndefined()
    act(() => result.current.handleRetry())
    expect(
      useSalesChannelsQueryMock.mock.results[0].value.refetchSalesChannels,
    ).toHaveBeenCalledOnce()

    await act(async () => result.current.handleStatusChange(channel, 'active'))
    expect(reactivateSalesChannel).toHaveBeenCalledWith('inactive-1')
    expect(result.current.announcement).toBe('Balcão foi reativado.')
  })

  it('keeps the page recoverable after a reactivation failure', async () => {
    useReactivateSalesChannelActionMock.mockReturnValue({
      error: null,
      isPending: false,
      reactivateSalesChannel: vi.fn().mockRejectedValue(new Error('Falha temporária')),
    })
    const { result } = renderHook(() => useSalesChannelsPage())

    await act(async () => result.current.handleStatusChange(channel, 'active'))
    expect(result.current.actionError).toBe('Falha temporária')
  })
})
