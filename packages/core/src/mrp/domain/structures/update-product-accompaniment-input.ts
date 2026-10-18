export type UpdateProductAccompanimentInput = {
  readonly accompanimentTypeId: string
  readonly quantityPerPortion: number
  readonly accompanimentPrice?: number
  readonly isGlobal?: boolean
}
