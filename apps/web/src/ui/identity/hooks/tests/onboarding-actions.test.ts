import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { IdentityService } from '@/rest/services/identity-service'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useConfirmIceCreamShopOnboardingAction } from '../use-confirm-ice-cream-shop-onboarding-action'
import { useCorrectIceCreamShopOnboardingEmailAction } from '../use-correct-ice-cream-shop-onboarding-email-action'
import { useGetIceCreamShopOnboardingAction } from '../use-get-ice-cream-shop-onboarding-action'
import { useRegisterIceCreamShopAction } from '../use-register-ice-cream-shop-action'
import { useResendIceCreamShopConfirmationAction } from '../use-resend-ice-cream-shop-confirmation-action'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))
vi.mock('@/rest/services/identity-service', () => ({ IdentityService: vi.fn() }))

const useRestContextMock = vi.mocked(useRestContext)
const identityServiceMock = vi.mocked(IdentityService)

describe('Onboarding action hooks', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('registers with the domain input and exposes the mapped result', async () => {
    const registration = {
      continuationToken: 'a'.repeat(43),
      onboarding: {
        establishmentName: 'Gelato Central',
        managerName: 'Ana',
        email: 'ana@example.com',
        expiresAt: new Date('2026-08-20T12:00:00.000Z'),
      },
    }
    const service = {
      registerIceCreamShop: vi
        .fn()
        .mockResolvedValue(new RestResponse({ body: registration })),
    }
    useRestContextMock.mockReturnValue({
      restClient: {} as never,
      identityService: {} as never,
      mrpService: {} as never,
      pdvService: {} as never,
    })
    identityServiceMock.mockReturnValue(service as never)
    const { result } = renderHook(() => useRegisterIceCreamShopAction())

    await act(async () => {
      await expect(
        result.current.registerIceCreamShop({
          establishmentName: 'Gelato Central',
          managerName: 'Ana',
          email: 'ana@example.com',
          password: 'password123',
        }),
      ).resolves.toEqual(registration)
    })
    expect(service.registerIceCreamShop).toHaveBeenCalledOnce()
    expect(result.current.error).toBeNull()
  })

  it('maps non-success responses to hook errors without leaking response details', async () => {
    const service = {
      confirmIceCreamShopOnboarding: vi
        .fn()
        .mockResolvedValue(
          new RestResponse({ statusCode: 422, errorMessage: 'invalid' }),
        ),
    }
    useRestContextMock.mockReturnValue({
      restClient: {} as never,
      identityService: {} as never,
      mrpService: {} as never,
      pdvService: {} as never,
    })
    identityServiceMock.mockReturnValue(service as never)
    const { result } = renderHook(() => useConfirmIceCreamShopOnboardingAction())

    await act(async () => {
      await expect(
        result.current.confirmIceCreamShopOnboarding('a'.repeat(43)),
      ).rejects.toBeInstanceOf(Error)
    })
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('keeps all onboarding actions domain-named', () => {
    useRestContextMock.mockReturnValue({
      restClient: {} as never,
      identityService: {} as never,
      mrpService: {} as never,
      pdvService: {} as never,
    })
    identityServiceMock.mockReturnValue({} as never)
    expect(
      Object.keys(renderHook(() => useGetIceCreamShopOnboardingAction()).result.current),
    ).toEqual(expect.arrayContaining(['getIceCreamShopOnboarding', 'isPending', 'error']))
    expect(
      Object.keys(
        renderHook(() => useResendIceCreamShopConfirmationAction()).result.current,
      ),
    ).toEqual(
      expect.arrayContaining(['resendIceCreamShopConfirmation', 'isPending', 'error']),
    )
    expect(
      Object.keys(
        renderHook(() => useCorrectIceCreamShopOnboardingEmailAction()).result.current,
      ),
    ).toEqual(
      expect.arrayContaining([
        'correctIceCreamShopOnboardingEmail',
        'isPending',
        'error',
      ]),
    )
  })
})
