export type LinkAccompanimentPortionsInput = {
  readonly portionProductIds?: readonly string[]
  readonly accompanimentTypeId: string
  readonly quantityPerPortion: number
  readonly accompanimentPrice?: number
  readonly isGlobal?: boolean
}
