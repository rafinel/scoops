import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useInactivateSalesChannelAction } from '@/ui/pdv/hooks/use-inactivate-sales-channel-action'

import { useChangeSalesChannelStatusDialog } from '../use-change-sales-channel-status-dialog'

import { makeSalesChannel } from '../../tests/sales-channel-test-fixtures'

vi.mock('@/ui/pdv/hooks/use-inactivate-sales-channel-action', () => ({
  useInactivateSalesChannelAction: vi.fn(),
}))

const useInactivateSalesChannelActionMock = vi.mocked(useInactivateSalesChannelAction)
const channel = makeSalesChannel()

describe('useChangeSalesChannelStatusDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('confirms once and reports success', async () => {
    const inactivateSalesChannel = vi.fn().mockResolvedValue(channel)
    useInactivateSalesChannelActionMock.mockReturnValue({
      error: null,
      inactivateSalesChannel,
      isPending: false,
    })
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useChangeSalesChannelStatusDialog({ channel, onSuccess }),
    )
    await act(async () => result.current.handleConfirm())
    expect(inactivateSalesChannel).toHaveBeenCalledOnce()
    expect(onSuccess).toHaveBeenCalledWith('Canal inativado com sucesso.')
  })

  it('preserves the dialog after a failed confirmation', async () => {
    useInactivateSalesChannelActionMock.mockReturnValue({
      error: null,
      inactivateSalesChannel: vi.fn().mockRejectedValue(new Error('Falha temporária')),
      isPending: false,
    })
    const { result } = renderHook(() =>
      useChangeSalesChannelStatusDialog({ channel, onSuccess: vi.fn() }),
    )
    await act(async () => result.current.handleConfirm())
    expect(result.current.actionError).toBe('Falha temporária')
  })
})
