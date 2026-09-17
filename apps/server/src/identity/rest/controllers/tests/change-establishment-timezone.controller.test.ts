import { UserProfile } from '@scoops/core/identity/domain/structures'
import { AccountFaker } from '@scoops/core/identity/domain/entities/fakers'
import type { Establishment } from '@scoops/core/identity/domain/entities'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'
import { describe, expect, it, vi } from 'vitest'
import { ChangeEstablishmentTimezoneController } from '@/identity/rest/controllers/change-establishment-timezone.controller'

describe('ChangeEstablishmentTimezoneController', () => {
  it('returns the updated timezone settings for a Manager', async () => {
    const establishment: Establishment = {
      id: 'establishment-1',
      name: 'Scoops',
      status: 'active',
      timeZone: 'America/Sao_Paulo',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    const replace = vi.fn().mockResolvedValue({
      ...establishment,
      timeZone: 'America/Fortaleza',
    })
    const database = {
      run: vi.fn(async (operation) =>
        operation({
          establishmentsRepository: {
            findById: vi.fn().mockResolvedValue(establishment),
            replace,
          },
          establishmentAuditRecordsRepository: { add: vi.fn() },
        } as never),
      ),
    } as unknown as IdentityDatabase
    const controller = new ChangeEstablishmentTimezoneController(database, {
      now: () => new Date('2026-01-02T00:00:00.000Z'),
    })
    const response = await controller.handle(
      { timeZone: 'America/Fortaleza' },
      AccountFaker.fake({
        id: 'user-1',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      }),
    )

    expect(replace).toHaveBeenCalledWith(
      'establishment-1',
      expect.objectContaining({ timeZone: 'America/Fortaleza' }),
    )
    expect(response.establishment.timeZone).toBe('America/Fortaleza')
  })
})
