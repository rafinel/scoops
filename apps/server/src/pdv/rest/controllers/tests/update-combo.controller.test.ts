import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'
import {
  operatorRequestAuthorization,
  managerRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

import {
  addPortionWithGlobalAccompaniment,
  comboCreate,
  expectedUpdatedAt,
} from './combo-controller-test-helpers'

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

  it('revises an active Combo with a global accompaniment and rejects it once the Portion row is gone', async () => {
    const { row, components } = await addPortionWithGlobalAccompaniment(fixture)
    const combo = await fixture.addCombo(
      comboCreate({
        name: 'Active Global Combo',
        status: 'active',
        fixedPrice: 15,
        components,
      }),
    )
    const body = {
      name: 'Revised Global Combo',
      fixedPrice: 14,
      components: combo.components,
      expectedUpdatedAt: expectedUpdatedAt(combo),
    }

    const revised = await request(fixture.app.getHttpServer())
      .patch(`/discounts/${combo.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send(body)
    await fixture.productAccompaniments.remove(row.establishmentId, row.productId, row.id)
    const current = await fixture.discounts.findById(combo.establishmentId, combo.id)
    const stale = await request(fixture.app.getHttpServer())
      .patch(`/discounts/${combo.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        ...body,
        name: 'Revised Again',
        expectedUpdatedAt: current ? expectedUpdatedAt(current) : body.expectedUpdatedAt,
      })

    expect(revised.status).toBe(200)
    expect(revised.body.combo).toMatchObject({
      name: 'Revised Global Combo',
      status: 'active',
      fixedPrice: 14,
    })
    expect(stale.status).toBe(400)
    await expect(
      fixture.discounts.findById(combo.establishmentId, combo.id),
    ).resolves.toMatchObject({ name: 'Revised Global Combo', status: 'active' })
  })

  it('rejects malformed update input at the HTTP boundary', async () => {
    const combo = await fixture.addCombo(comboCreate())
    const response = await request(fixture.app.getHttpServer())
      .patch(`/discounts/${combo.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: '', fixedPrice: 0, components: [], expectedUpdatedAt: 'invalid' })

    expect(response.status).toBe(422)
  })
  it('denies Operator access to this Manager-only route before controller execution', async () => {
    const response = await request(fixture.app.getHttpServer())
      .patch('/discounts/00000000-0000-4000-8000-000000000001')
      .set('Cookie', operatorRequestAuthorization())

    expect(response.status).toBe(403)
  })
})
