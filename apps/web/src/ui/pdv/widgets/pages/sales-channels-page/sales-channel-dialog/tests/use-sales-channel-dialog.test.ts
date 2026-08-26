import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateSalesChannelAction } from '@/ui/pdv/hooks/use-create-sales-channel-action'
import { useUpdateSalesChannelAction } from '@/ui/pdv/hooks/use-update-sales-channel-action'

import { useSalesChannelDialog } from '../use-sales-channel-dialog'

import { makeSalesChannel } from '../../tests/sales-channel-test-fixtures'

vi.mock('@/ui/pdv/hooks/use-create-sales-channel-action', () => ({
  useCreateSalesChannelAction: vi.fn(),
}))
vi.mock('@/ui/pdv/hooks/use-update-sales-channel-action', () => ({
  useUpdateSalesChannelAction: vi.fn(),
}))

const useCreateSalesChannelActionMock = vi.mocked(useCreateSalesChannelAction)
const useUpdateSalesChannelActionMock = vi.mocked(useUpdateSalesChannelAction)
const channel = makeSalesChannel({ name: 'Balcão', percentage: 0 })

const defaultProps = {
  mode: 'add' as const,
  onOpenChange: vi.fn(),
  onRequestStatusChange: vi.fn(),
  onSuccess: vi.fn(),
  open: true,
}

describe('useSalesChannelDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCreateSalesChannelActionMock.mockReturnValue({
      createSalesChannel: vi.fn().mockResolvedValue(channel),
      error: null,
      isPending: false,
    })
    useUpdateSalesChannelActionMock.mockReturnValue({
      error: null,
      isPending: false,
      updateSalesChannel: vi.fn().mockResolvedValue(channel),
    })
  })

  it('submits a valid create payload and announces success', async () => {
    const createSalesChannel = vi.fn().mockResolvedValue(channel)
    useCreateSalesChannelActionMock.mockReturnValue({
      createSalesChannel,
      error: null,
      isPending: false,
    })
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useSalesChannelDialog({ ...defaultProps, onSuccess }),
    )
    const nameField = result.current.register('name')
    const percentageField = result.current.register('percentage')
    const nameInput = document.createElement('input')
    const percentageInput = document.createElement('input')
    nameInput.name = nameField.name
    percentageInput.name = percentageField.name
    document.body.append(nameInput, percentageInput)
    nameField.ref(nameInput)
    percentageField.ref(percentageInput)

    await act(async () => {
      await nameField.onChange({
        target: { name: 'name', value: ' Delivery ' },
        type: 'change',
      })
      await percentageField.onChange({
        target: { name: 'percentage', value: '12,00' },
        type: 'change',
      })
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(createSalesChannel).toHaveBeenCalledWith({
      name: 'Delivery',
      percentage: 12,
      status: 'active',
    })
    expect(onSuccess).toHaveBeenCalledWith('Canal criado com sucesso.')
  })

  it('updates an existing channel and routes status changes separately', async () => {
    const updateSalesChannel = vi.fn().mockResolvedValue(channel)
    useUpdateSalesChannelActionMock.mockReturnValue({
      error: null,
      isPending: false,
      updateSalesChannel,
    })
    const onRequestStatusChange = vi.fn()
    const { result } = renderHook(() =>
      useSalesChannelDialog({
        channel,
        mode: 'edit',
        onOpenChange: defaultProps.onOpenChange,
        onRequestStatusChange,
        onSuccess: defaultProps.onSuccess,
        open: true,
      }),
    )

    await act(async () =>
      result.current.handleSubmit({ preventDefault: vi.fn() } as never),
    )
    expect(updateSalesChannel).toHaveBeenCalledWith({
      channelId: 'channel-1',
      input: { name: 'Balcão', percentage: 0 },
    })
    act(() => result.current.handleStatusChange('inactive'))
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    expect(onRequestStatusChange).toHaveBeenCalledWith(channel, 'inactive')
  })

  it('retains the dialog with a server failure', async () => {
    useCreateSalesChannelActionMock.mockReturnValue({
      createSalesChannel: vi.fn().mockRejectedValue(new Error('Nome já cadastrado')),
      error: null,
      isPending: false,
    })
    const { result } = renderHook(() => useSalesChannelDialog(defaultProps))
    const registeredName = result.current.register('name')
    const registeredPercentage = result.current.register('percentage')
    const nameInput = document.createElement('input')
    const percentageInput = document.createElement('input')
    nameInput.name = registeredName.name
    percentageInput.name = registeredPercentage.name
    document.body.append(nameInput, percentageInput)
    registeredName.ref(nameInput)
    registeredPercentage.ref(percentageInput)
    await act(async () => {
      await registeredName.onChange({
        target: { name: 'name', value: 'Delivery' },
        type: 'change',
      })
      await registeredPercentage.onChange({
        target: { name: 'percentage', value: '12' },
        type: 'change',
      })
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })
    expect(result.current.actionError).toBe('Nome já cadastrado')
  })
})
