export const BillingPlanCode = {
  Complete: 'scoops-complete',
} as const

export type BillingPlanCode = (typeof BillingPlanCode)[keyof typeof BillingPlanCode]

export type BillingPlan = {
  readonly code: BillingPlanCode
  readonly name: 'Scoops Completo'
  readonly monthlyPrice: 59.9
  readonly currency: 'BRL'
  readonly interval: 'monthly'
}

export const ScoopsCompletePlan: BillingPlan = {
  code: BillingPlanCode.Complete,
  name: 'Scoops Completo',
  monthlyPrice: 59.9,
  currency: 'BRL',
  interval: 'monthly',
}
