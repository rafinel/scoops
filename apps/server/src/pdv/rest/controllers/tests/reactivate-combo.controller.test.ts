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

describe('Reactivate Combo Controller [PATCH /discounts/:discountId/reactivate]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('does not reactivate a Combo when current product facts are unavailable', async () => {
    const combo = await fixture.addCombo(comboCreate())

    const response = await request(fixture.app.getHttpServer())
      .patch(`/discounts/${combo.id}/reactivate`)
      .set('Authorization', managerRequestAuthorization())
      .send({ expectedUpdatedAt: expectedUpdatedAt(combo) })

    expect(response.status).toBe(400)
    expect(response.body.message).toContain('disponíveis')
    await expect(
      fixture.discounts.findById(combo.establishmentId, combo.id),
    ).resolves.toMatchObject({ status: 'inactive' })
  })

  it('rejects an invalid lifecycle version without changing persistence', async () => {
    const combo = await fixture.addCombo(comboCreate())
    const response = await request(fixture.app.getHttpServer())
      .patch(`/discounts/${combo.id}/reactivate`)
      .set('Authorization', managerRequestAuthorization())
      .send({ expectedUpdatedAt: 'not-a-date' })

    expect(response.status).toBe(422)
    await expect(
      fixture.discounts.findById(combo.establishmentId, combo.id),
    ).resolves.toMatchObject({ status: 'inactive' })
  })
})
