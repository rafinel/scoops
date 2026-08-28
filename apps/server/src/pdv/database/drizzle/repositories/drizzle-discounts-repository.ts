import type { Combo } from '@scoops/core/pdv/domain/entities'
import type {
  ComboCreate,
  ComboListParams,
  ComboUpdate,
  DiscountStatus,
} from '@scoops/core/pdv/domain/structures'
import type { DiscountsRepository } from '@scoops/core/pdv/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
import { and, asc, count, eq, exists, ilike, inArray, or, sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleComboMapper } from '@/pdv/database/drizzle/mappers/drizzle-combo-mapper'
import { discountComponentAccompanimentModel } from '@/pdv/database/drizzle/models/discount-component-accompaniment-model'
import { discountComponentModel } from '@/pdv/database/drizzle/models/discount-component-model'
import { discountModel } from '@/pdv/database/drizzle/models/discount-model'

type DiscountCreateRow = {
  id: string
  establishmentId: string
  name: string
  type: 'combo'
  status: DiscountStatus
  fixedPrice: string
  createdAt: Date
  updatedAt: Date
}

type ComponentCreateRow = {
  id: string
  discountId: string
  productId: string
  kind: 'portion' | 'resale'
  quantity: number
  sizeId: string | null
  brandId: string | null
  position: number
}

type AccompanimentCreateRow = {
  componentId: string
  accompanimentId: string
  position: number
}

type AggregateRows = {
  components: readonly (typeof discountComponentModel.$inferSelect)[]
  accompaniments: readonly (typeof discountComponentAccompanimentModel.$inferSelect)[]
}

@Injectable()
export class DrizzleDiscountsRepository
  extends DrizzleRepository
  implements DiscountsRepository
{
  async add(input: ComboCreate): Promise<Combo> {
    const [combo] = await this.addMany([input])
    return combo
  }

  async addMany(inputs: ComboCreate[]): Promise<readonly Combo[]> {
    if (inputs.length === 0) return []

    try {
      const now = new Date()
      const aggregateInputs = inputs.map((input) => this.toCreateRows(input, now))
      const discountRecords = await this.database
        .insert(discountModel)
        .values(aggregateInputs.map(({ discount }) => discount))
        .returning()

      const componentInputs = aggregateInputs.flatMap(({ components }) => components)
      const componentRecords = componentInputs.length
        ? await this.database
            .insert(discountComponentModel)
            .values(componentInputs)
            .returning()
        : []
      const accompanimentInputs = aggregateInputs.flatMap(
        ({ accompaniments }) => accompaniments,
      )
      const accompanimentRecords = accompanimentInputs.length
        ? await this.database
            .insert(discountComponentAccompanimentModel)
            .values(accompanimentInputs)
            .returning()
        : []

      return discountRecords.map((discount) => {
        const aggregateRows = this.selectAggregateRows(
          discount.id,
          componentRecords,
          accompanimentRecords,
        )
        return DrizzleComboMapper.toDomain(
          discount,
          aggregateRows.components,
          aggregateRows.accompaniments,
        )
      })
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async findById(
    establishmentId: string,
    discountId: string,
  ): Promise<Combo | undefined> {
    const [discount] = await this.database
      .select()
      .from(discountModel)
      .where(
        and(
          eq(discountModel.establishmentId, establishmentId),
          eq(discountModel.id, discountId),
          eq(discountModel.type, 'combo'),
        ),
      )
      .limit(1)

    if (!discount) return undefined
    const aggregateRows = await this.findAggregateRows([discount.id])
    return DrizzleComboMapper.toDomain(
      discount,
      aggregateRows.get(discount.id)?.components ?? [],
      aggregateRows.get(discount.id)?.accompaniments ?? [],
    )
  }

  async findByNormalizedName(
    establishmentId: string,
    normalizedName: string,
  ): Promise<Combo | undefined> {
    const [discount] = await this.database
      .select()
      .from(discountModel)
      .where(
        and(
          eq(discountModel.establishmentId, establishmentId),
          eq(discountModel.type, 'combo'),
          sql`lower(btrim(${discountModel.name})) = ${normalizedName}`,
        ),
      )
      .limit(1)

    if (!discount) return undefined
    const aggregateRows = await this.findAggregateRows([discount.id])
    return DrizzleComboMapper.toDomain(
      discount,
      aggregateRows.get(discount.id)?.components ?? [],
      aggregateRows.get(discount.id)?.accompaniments ?? [],
    )
  }

  async findPage(
    input: ComboListParams,
    matchingProductIds?: readonly string[],
  ): Promise<PaginationResponse<Combo>> {
    const filters = [
      eq(discountModel.establishmentId, input.establishmentId),
      eq(discountModel.type, input.type ?? 'combo'),
    ]
    if (input.status) filters.push(eq(discountModel.status, input.status))

    if (input.search) {
      const nameMatch = ilike(discountModel.name, `%${input.search}%`)
      const productMatch =
        matchingProductIds === undefined
          ? undefined
          : matchingProductIds.length === 0
            ? sql`false`
            : exists(
                this.database
                  .select({ id: discountComponentModel.id })
                  .from(discountComponentModel)
                  .where(
                    and(
                      eq(discountComponentModel.discountId, discountModel.id),
                      inArray(discountComponentModel.productId, [...matchingProductIds]),
                    ),
                  ),
              )
      filters.push(productMatch ? (or(nameMatch, productMatch) ?? nameMatch) : nameMatch)
    }

    const where = and(...filters)
    const [discountRecords, totalRecords] = await Promise.all([
      this.database
        .select()
        .from(discountModel)
        .where(where)
        .orderBy(asc(sql`lower(btrim(${discountModel.name}))`), asc(discountModel.id))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      this.database.select({ count: count() }).from(discountModel).where(where),
    ])
    const total = Number(totalRecords[0]?.count ?? 0)
    if (discountRecords.length === 0) {
      return new PaginationResponse(
        [],
        input.page,
        input.pageSize,
        total,
        Math.ceil(total / input.pageSize),
      )
    }

    const aggregateRows = await this.findAggregateRows(
      discountRecords.map((discount) => discount.id),
    )
    const combos = discountRecords.map((discount) => {
      const rows = aggregateRows.get(discount.id)
      return DrizzleComboMapper.toDomain(
        discount,
        rows?.components ?? [],
        rows?.accompaniments ?? [],
      )
    })

    return new PaginationResponse(
      combos,
      input.page,
      input.pageSize,
      total,
      Math.ceil(total / input.pageSize),
    )
  }

  async findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly Combo[]> {
    const discounts = await this.database
      .select()
      .from(discountModel)
      .where(
        and(
          eq(discountModel.establishmentId, establishmentId),
          eq(discountModel.type, 'combo'),
          exists(
            this.database
              .select({ id: discountComponentModel.id })
              .from(discountComponentModel)
              .where(
                and(
                  eq(discountComponentModel.discountId, discountModel.id),
                  eq(discountComponentModel.productId, productId),
                ),
              ),
          ),
        ),
      )
      .orderBy(asc(sql`lower(btrim(${discountModel.name}))`), asc(discountModel.id))

    if (discounts.length === 0) return []
    const aggregateRows = await this.findAggregateRows(
      discounts.map((discount) => discount.id),
    )
    return discounts.map((discount) => {
      const rows = aggregateRows.get(discount.id)
      return DrizzleComboMapper.toDomain(
        discount,
        rows?.components ?? [],
        rows?.accompaniments ?? [],
      )
    })
  }

  async findActive(establishmentId: string): Promise<readonly Combo[]> {
    const records = await this.database
      .select()
      .from(discountModel)
      .where(
        and(
          eq(discountModel.establishmentId, establishmentId),
          eq(discountModel.type, 'combo'),
          eq(discountModel.status, 'active'),
        ),
      )
      .orderBy(asc(discountModel.createdAt), asc(discountModel.id))

    if (records.length === 0) return []
    const aggregateRows = await this.findAggregateRows(
      records.map((discount) => discount.id),
    )
    return records.map((discount) => {
      const rows = aggregateRows.get(discount.id)
      return DrizzleComboMapper.toDomain(
        discount,
        rows?.components ?? [],
        rows?.accompaniments ?? [],
      )
    })
  }

  async replace(
    establishmentId: string,
    discountId: string,
    changes: ComboUpdate,
  ): Promise<Combo> {
    try {
      const now = new Date()
      const [discount] = await this.database
        .update(discountModel)
        .set({
          name: changes.name.trim(),
          fixedPrice: String(changes.fixedPrice),
          updatedAt: now,
        })
        .where(
          and(
            eq(discountModel.establishmentId, establishmentId),
            eq(discountModel.id, discountId),
            eq(discountModel.type, 'combo'),
            eq(discountModel.updatedAt, changes.expectedUpdatedAt),
          ),
        )
        .returning()

      if (!discount) throw new ConflictError('Database operation conflicted')
      await this.replaceComponents(discountId, changes.components)
      return this.findRequired(discount)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async setStatus(
    establishmentId: string,
    discountId: string,
    status: DiscountStatus,
    expectedUpdatedAt: Date,
  ): Promise<Combo> {
    try {
      const [discount] = await this.database
        .update(discountModel)
        .set({ status, updatedAt: new Date() })
        .where(
          and(
            eq(discountModel.establishmentId, establishmentId),
            eq(discountModel.id, discountId),
            eq(discountModel.type, 'combo'),
            eq(discountModel.updatedAt, expectedUpdatedAt),
          ),
        )
        .returning()

      if (!discount) throw new ConflictError('Database operation conflicted')
      return this.findRequired(discount)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async remove(
    establishmentId: string,
    discountId: string,
    expectedUpdatedAt: Date,
  ): Promise<void> {
    try {
      const records = await this.database
        .delete(discountModel)
        .where(
          and(
            eq(discountModel.establishmentId, establishmentId),
            eq(discountModel.id, discountId),
            eq(discountModel.type, 'combo'),
            eq(discountModel.updatedAt, expectedUpdatedAt),
          ),
        )
        .returning({ id: discountModel.id })
      if (records.length === 0) throw new ConflictError('Database operation conflicted')
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async removeAll(): Promise<void> {
    await this.database.delete(discountComponentAccompanimentModel)
    await this.database.delete(discountComponentModel)
    await this.database.delete(discountModel)
  }

  private toCreateRows(
    input: ComboCreate,
    now: Date,
  ): {
    discount: DiscountCreateRow
    components: readonly ComponentCreateRow[]
    accompaniments: readonly AccompanimentCreateRow[]
  } {
    const discountId = crypto.randomUUID()
    const components = input.components.map((component, position) => ({
      id: crypto.randomUUID(),
      discountId,
      productId: component.productId,
      kind: component.kind,
      quantity: component.quantity,
      sizeId: component.kind === 'portion' ? component.sizeId : null,
      brandId: component.kind === 'resale' ? (component.brandId ?? null) : null,
      position,
    }))

    return {
      discount: {
        id: discountId,
        establishmentId: input.establishmentId,
        name: input.name.trim(),
        type: 'combo',
        status: input.status,
        fixedPrice: String(input.fixedPrice),
        createdAt: now,
        updatedAt: now,
      },
      components,
      accompaniments: input.components.flatMap((component, componentPosition) => {
        if (component.kind !== 'portion') return []
        const componentId = components[componentPosition].id
        return component.accompanimentIds.map((accompanimentId, position) => ({
          componentId,
          accompanimentId,
          position,
        }))
      }),
    }
  }

  private async replaceComponents(
    discountId: string,
    components: ComboUpdate['components'],
  ): Promise<void> {
    await this.database
      .delete(discountComponentModel)
      .where(eq(discountComponentModel.discountId, discountId))

    const componentRows = components.map((component, position) => ({
      id: crypto.randomUUID(),
      discountId,
      productId: component.productId,
      kind: component.kind,
      quantity: component.quantity,
      sizeId: component.kind === 'portion' ? component.sizeId : null,
      brandId: component.kind === 'resale' ? (component.brandId ?? null) : null,
      position,
    }))
    if (componentRows.length)
      await this.database.insert(discountComponentModel).values(componentRows)

    const accompanimentRows = components.flatMap((component, componentPosition) => {
      if (component.kind !== 'portion') return []
      return component.accompanimentIds.map((accompanimentId, position) => ({
        componentId: componentRows[componentPosition].id,
        accompanimentId,
        position,
      }))
    })
    if (accompanimentRows.length)
      await this.database
        .insert(discountComponentAccompanimentModel)
        .values(accompanimentRows)
  }

  private async findRequired(
    discount: typeof discountModel.$inferSelect,
  ): Promise<Combo> {
    const aggregateRows = await this.findAggregateRows([discount.id])
    const rows = aggregateRows.get(discount.id)
    return DrizzleComboMapper.toDomain(
      discount,
      rows?.components ?? [],
      rows?.accompaniments ?? [],
    )
  }

  private async findAggregateRows(
    discountIds: readonly string[],
  ): Promise<Map<string, AggregateRows>> {
    if (discountIds.length === 0) return new Map()
    const [components, accompaniments] = await Promise.all([
      this.database
        .select()
        .from(discountComponentModel)
        .where(inArray(discountComponentModel.discountId, [...discountIds]))
        .orderBy(asc(discountComponentModel.position), asc(discountComponentModel.id)),
      this.database
        .select()
        .from(discountComponentAccompanimentModel)
        .where(
          inArray(
            discountComponentAccompanimentModel.componentId,
            this.database
              .select({ id: discountComponentModel.id })
              .from(discountComponentModel)
              .where(inArray(discountComponentModel.discountId, [...discountIds])),
          ),
        )
        .orderBy(
          asc(discountComponentAccompanimentModel.position),
          asc(discountComponentAccompanimentModel.accompanimentId),
        ),
    ])
    const rowsByDiscountId = new Map<string, AggregateRows>()
    for (const discountId of discountIds) {
      const discountComponents = components.filter(
        (component) => component.discountId === discountId,
      )
      const componentIds = new Set(discountComponents.map((component) => component.id))
      rowsByDiscountId.set(discountId, {
        components: discountComponents,
        accompaniments: accompaniments.filter((accompaniment) =>
          componentIds.has(accompaniment.componentId),
        ),
      })
    }
    return rowsByDiscountId
  }

  private selectAggregateRows(
    discountId: string,
    components: readonly (typeof discountComponentModel.$inferSelect)[],
    accompaniments: readonly (typeof discountComponentAccompanimentModel.$inferSelect)[],
  ): AggregateRows {
    const discountComponents = components.filter(
      (component) => component.discountId === discountId,
    )
    const componentIds = new Set(discountComponents.map((component) => component.id))
    return {
      components: discountComponents,
      accompaniments: accompaniments.filter((accompaniment) =>
        componentIds.has(accompaniment.componentId),
      ),
    }
  }

  private isIntegrityConstraintError(error: unknown): boolean {
    let currentError: unknown = error
    while (currentError && typeof currentError === 'object') {
      if (
        'code' in currentError &&
        (currentError.code === '23505' ||
          currentError.code === '23503' ||
          currentError.code === '23514')
      ) {
        return true
      }
      if (!('cause' in currentError)) return false
      currentError = currentError.cause
    }
    return false
  }

  private toConflictError(error: unknown): unknown {
    if (this.isIntegrityConstraintError(error)) {
      return new ConflictError('Database operation conflicted')
    }
    return error
  }
}
