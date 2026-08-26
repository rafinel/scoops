import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'

import type { Account } from '@scoops/core/identity/domain/entities'
import type { EstablishmentSettings } from '@scoops/core/identity/domain/structures'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

import { useChangeEstablishmentNameAction } from '../use-change-establishment-name-action'
import { useChangeOwnUserNameAction } from '../use-change-own-user-name-action'
import { useEstablishmentSettingsQuery } from '../use-establishment-settings-query'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))

const useRestContextMock = vi.mocked(useRestContext)
const useAuthContextMock = vi.mocked(useAuthContext)

describe('Profile and settings action hooks', () => {
  function createQueryWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('refreshes the account after a successful self-name mutation', async () => {
    const account = {} as Account
    const service = {
      changeOwnUserName: vi.fn().mockResolvedValue(new RestResponse({ body: account })),
    }
    const refreshAccountMock = vi.fn().mockResolvedValue(account)
    const retryLocalAccessMock = vi.fn().mockResolvedValue(undefined)
    useRestContextMock.mockReturnValue({
      restClient: {} as never,
      identityService: service as never,
      mrpService: {} as never,
      pdvService: {} as never,
    })
    useAuthContextMock.mockReturnValue({
      refreshAccount: refreshAccountMock,
      retryLocalAccess: retryLocalAccessMock,
    } as never)

    const { result } = renderHook(() => useChangeOwnUserNameAction(), {
      wrapper: createQueryWrapper(),
    })

    await act(async () => {
      await expect(result.current.changeOwnUserName('Updated name')).resolves.toBe(
        account,
      )
    })

    expect(service.changeOwnUserName).toHaveBeenCalledWith('Updated name')
    expect(refreshAccountMock).toHaveBeenCalledOnce()
    expect(retryLocalAccessMock).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('keeps a self-name mutation retryable while recovering an expired session', async () => {
    const retryLocalAccessMock = vi.fn().mockResolvedValue(undefined)
    const service = {
      changeOwnUserName: vi.fn().mockResolvedValue(new RestResponse({ statusCode: 401 })),
    }
    useRestContextMock.mockReturnValue({
      restClient: {} as never,
      identityService: service as never,
      mrpService: {} as never,
      pdvService: {} as never,
    })
    useAuthContextMock.mockReturnValue({
      refreshAccount: vi.fn(),
      retryLocalAccess: retryLocalAccessMock,
    } as never)

    const { result } = renderHook(() => useChangeOwnUserNameAction(), {
      wrapper: createQueryWrapper(),
    })

    await act(async () => {
      await expect(
        result.current.changeOwnUserName('Updated name'),
      ).rejects.toBeInstanceOf(Error)
    })

    expect(retryLocalAccessMock).toHaveBeenCalledOnce()
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))
  })

  it('recovers the shared auth boundary before exposing a shop-name mutation error', async () => {
    const retryLocalAccessMock = vi.fn().mockResolvedValue(undefined)
    const service = {
      changeEstablishmentName: vi
        .fn()
        .mockResolvedValue(new RestResponse<EstablishmentSettings>({ statusCode: 401 })),
    }
    useRestContextMock.mockReturnValue({
      restClient: {} as never,
      identityService: service as never,
      mrpService: {} as never,
      pdvService: {} as never,
    })
    useAuthContextMock.mockReturnValue({
      retryLocalAccess: retryLocalAccessMock,
    } as never)

    const queryClient = new QueryClient()
    const { result } = renderHook(() => useChangeEstablishmentNameAction(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await act(async () => {
      await expect(
        result.current.changeEstablishmentName('Scoops Centro'),
      ).rejects.toBeInstanceOf(Error)
    })

    expect(retryLocalAccessMock).toHaveBeenCalledOnce()
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))
  })

  it('recovers the shared auth boundary when shop settings loading returns 401', async () => {
    const retryLocalAccessMock = vi.fn().mockResolvedValue(undefined)
    const service = {
      getEstablishmentSettings: vi
        .fn()
        .mockResolvedValue(new RestResponse<EstablishmentSettings>({ statusCode: 401 })),
    }
    useRestContextMock.mockReturnValue({
      restClient: {} as never,
      identityService: service as never,
      mrpService: {} as never,
      pdvService: {} as never,
    })
    useAuthContextMock.mockReturnValue({
      retryLocalAccess: retryLocalAccessMock,
    } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const { result } = renderHook(() => useEstablishmentSettingsQuery(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))

    expect(retryLocalAccessMock).toHaveBeenCalledOnce()
    expect(result.current.settings).toBeUndefined()
  })
})
