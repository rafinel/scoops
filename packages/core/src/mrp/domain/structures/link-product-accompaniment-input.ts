export type LinkProductAccompanimentInput = {
  readonly accompanimentProductId: string
  readonly accompanimentTypeId: string
  readonly quantityPerPortion: number
  readonly accompanimentPrice?: number
  readonly isGlobal?: boolean
}
