import type { Combo } from '#pdv/domain/entities/combo.ts'
import type { ComboComponentDetails } from '#pdv/domain/structures/combo-component-details.ts'

export type ComboDetails = {
  readonly combo: Combo
  readonly components: readonly ComboComponentDetails[]
  readonly normalPrice: number
  readonly savings: number
}
