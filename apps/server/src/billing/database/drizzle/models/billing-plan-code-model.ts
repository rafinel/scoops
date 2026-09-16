import {
  BillingPlanCode,
  type BillingPlanCode as BillingPlanCodeValue,
} from '@scoops/core/billing/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const billingPlanCodeModel = pgEnum(
  'billing_plan_code',
  Object.values(BillingPlanCode) as [BillingPlanCodeValue, ...BillingPlanCodeValue[]],
)
