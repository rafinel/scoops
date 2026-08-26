import type { DiscountComponent } from '#pdv/domain/structures/discount-component.ts'

export type ComboComponentDetails = {
  readonly component: DiscountComponent
  readonly productName: string
  readonly configurationName: string
  readonly accompanimentNames: readonly string[]
  readonly unitPrice: number
  readonly subtotal: number
  readonly validity: 'valid' | 'invalid'
}
