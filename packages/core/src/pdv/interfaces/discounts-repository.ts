import type { Combo, ComboCreate, ComboUpdate } from '#pdv/domain/entities/combo.ts'

export interface DiscountsRepository {
  add(input: ComboCreate): Promise<Combo>
  findById(establishmentId: string, discountId: string): Promise<Combo | undefined>
  findByName(establishmentId: string, name: string): Promise<Combo | undefined>
  findActive(establishmentId: string): Promise<readonly Combo[]>
  findMany(establishmentId: string): Promise<readonly Combo[]>
  replace(
    establishmentId: string,
    discountId: string,
    changes: ComboUpdate,
  ): Promise<Combo>
  remove(establishmentId: string, discountId: string): Promise<void>
}
