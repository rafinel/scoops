import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import type { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'
import {
  managerRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

import { comboCreate, expectedUpdatedAt } from './combo-controller-test-helpers'

describe('Delete Combo Controller [DELETE /discounts/:discountId]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('deletes only the current Combo and publishes its deletion event', async () => {
    const combo = await fixture.addCombo(comboCreate())

    const response = await request(fixture.app.getHttpServer())
      .delete(`/discounts/${combo.id}`)
      .query({ expectedUpdatedAt: expectedUpdatedAt(combo) })
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(204)
    expect(response.text).toBe('')
    await expect(
      fixture.discounts.findById(combo.establishmentId, combo.id),
    ).resolves.toBeUndefined()
    expect(fixture.broker.events.at(-1)?.name).toBe('pdv/discount.deleted')
  })

  it('returns a conflict for a stale version and preserves the Combo', async () => {
    const combo = await fixture.addCombo(comboCreate())
    const response = await request(fixture.app.getHttpServer())
      .delete(`/discounts/${combo.id}`)
      .query({ expectedUpdatedAt: new Date(0).toISOString() })
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(409)
    await expect(
      fixture.discounts.findById(combo.establishmentId, combo.id),
    ).resolves.toMatchObject({ id: combo.id })
  })
})
