import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'

import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useCancelUserInvitationAction } from '../use-cancel-user-invitation-action'
import { useInviteUserAction } from '../use-invite-user-action'
import { identityQueryKeys } from '../identity-query-keys'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const useRestContextMock = vi.mocked(useRestContext)

describe('User-management action hooks', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('keeps invite input domain-named and invalidates the users list after success', async () => {
    const service = {
      inviteUser: vi.fn().mockResolvedValue(new RestResponse({ body: {} })),
    }
    const queryClient = new QueryClient()
    const invalidateQueriesMock = vi.spyOn(queryClient, 'invalidateQueries')
    useRestContextMock.mockReturnValue({
      restClient: {} as never,
      identityService: service as never,
      mrpService: {} as never,
    })

    const { result } = renderHook(() => useInviteUserAction(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    const input = { name: 'Ana', email: 'ana@example.com', profile: 'operator' as const }
    await act(async () => {
      await result.current.inviteUser(input)
    })

    expect(service.inviteUser).toHaveBeenCalledWith(input)
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: identityQueryKeys.usersRoot(),
    })
    expect(result.current.error).toBeNull()
  })

  it('removes a cancelled invitation detail cache and invalidates the list', async () => {
    const service = {
      cancelUserInvitation: vi.fn().mockResolvedValue(new RestResponse()),
    }
    const queryClient = new QueryClient()
    const removeQueriesMock = vi.spyOn(queryClient, 'removeQueries')
    const invalidateQueriesMock = vi.spyOn(queryClient, 'invalidateQueries')
    useRestContextMock.mockReturnValue({
      restClient: {} as never,
      identityService: service as never,
      mrpService: {} as never,
    })

    const { result } = renderHook(() => useCancelUserInvitationAction(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await act(async () => {
      await result.current.cancelUserInvitation('user-id')
    })

    expect(removeQueriesMock).toHaveBeenCalledWith({
      queryKey: identityQueryKeys.userDetails('user-id'),
    })
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: identityQueryKeys.usersRoot(),
    })
  })
})
