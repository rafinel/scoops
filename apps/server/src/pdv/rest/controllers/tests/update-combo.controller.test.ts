import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'
import {
  managerRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

import { comboCreate, expectedUpdatedAt } from './combo-controller-test-helpers'

describe('Update Combo Controller [PATCH /discounts/:discountId]', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('updates an inactive Combo and rejects a stale optimistic version', async () => {
    const combo = await fixture.addCombo(comboCreate({ name: 'Before' }))
    const body = {
      name: '  After  ',
      fixedPrice: 12.5,
      components: combo.components,
      expectedUpdatedAt: expectedUpdatedAt(combo),
    }

    const response = await request(fixture.app.getHttpServer())
      .patch(`/discounts/${combo.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send(body)
    const stale = await request(fixture.app.getHttpServer())
      .patch(`/discounts/${combo.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, name: 'Stale' })

    expect(response.status).toBe(200)
    expect(response.body.combo).toMatchObject({ name: 'After', fixedPrice: 12.5 })
    expect(stale.status).toBe(409)
    await expect(
      fixture.discounts.findById(combo.establishmentId, combo.id),
    ).resolves.toMatchObject({ name: 'After' })
  })

  it('rejects malformed update input at the HTTP boundary', async () => {
    const combo = await fixture.addCombo(comboCreate())
    const response = await request(fixture.app.getHttpServer())
      .patch(`/discounts/${combo.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: '', fixedPrice: 0, components: [], expectedUpdatedAt: 'invalid' })

    expect(response.status).toBe(422)
  })
})
