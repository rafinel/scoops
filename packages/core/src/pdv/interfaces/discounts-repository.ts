import type { Combo } from '#pdv/domain/entities/combo.ts'
import type { ComboCreate } from '#pdv/domain/structures/combo-create.ts'
import type { ComboListParams } from '#pdv/domain/structures/combo-list-params.ts'
import type { ComboUpdate } from '#pdv/domain/structures/combo-update.ts'
import type { DiscountStatus } from '#pdv/domain/structures/discount-status.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'

export interface DiscountsRepository {
  add(input: ComboCreate): Promise<Combo>
  findById(establishmentId: string, discountId: string): Promise<Combo | undefined>
  findByNormalizedName(
    establishmentId: string,
    normalizedName: string,
  ): Promise<Combo | undefined>
  findPage(
    input: ComboListParams,
    matchingProductIds?: readonly string[],
  ): Promise<PaginationResponse<Combo>>
  findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly Combo[]>
  findActive(establishmentId: string): Promise<readonly Combo[]>
  replace(
    establishmentId: string,
    discountId: string,
    changes: ComboUpdate,
  ): Promise<Combo>
  setStatus(
    establishmentId: string,
    discountId: string,
    status: DiscountStatus,
    expectedUpdatedAt: Date,
  ): Promise<Combo>
  remove(
    establishmentId: string,
    discountId: string,
    expectedUpdatedAt: Date,
  ): Promise<void>
}
