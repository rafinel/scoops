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

describe('Inactivate Combo Controller [PATCH /discounts/:discountId/inactivate]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('inactivates the persisted Combo and publishes one update event', async () => {
    const combo = await fixture.addCombo(comboCreate({ status: 'active' }))

    const response = await request(fixture.app.getHttpServer())
      .patch(`/discounts/${combo.id}/inactivate`)
      .set('Authorization', managerRequestAuthorization())
      .send({ expectedUpdatedAt: expectedUpdatedAt(combo) })

    expect(response.status).toBe(200)
    expect(response.body.combo.status).toBe('inactive')
    await expect(
      fixture.discounts.findById(combo.establishmentId, combo.id),
    ).resolves.toMatchObject({ status: 'inactive' })
    expect(fixture.broker.events.at(-1)?.name).toBe('pdv/discount.updated')
  })

  it('is idempotent for an already inactive Combo', async () => {
    const combo = await fixture.addCombo(comboCreate())
    const response = await request(fixture.app.getHttpServer())
      .patch(`/discounts/${combo.id}/inactivate`)
      .set('Authorization', managerRequestAuthorization())
      .send({ expectedUpdatedAt: expectedUpdatedAt(combo) })

    expect(response.status).toBe(200)
    expect(response.body.combo.status).toBe('inactive')
    expect(fixture.broker.events).toHaveLength(0)
  })
})
