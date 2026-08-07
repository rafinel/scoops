import type { Entity } from '#shared/domain/entities/entity.ts'
import type { ChargeStatus } from '#billing/domain/structures/charge-status.ts'
import type { PaymentMethodType } from '#billing/domain/structures/payment-method-type.ts'

export type Charge = Entity & {
  establishmentId: string
  subscriptionId: string
  providerChargeId?: string
  competence: string
  dueAt: Date
  paidAt?: Date
  amount: number
  currency: 'BRL'
  paymentMethodType: PaymentMethodType
  status: ChargeStatus
  receiptUrl?: string
  fiscalDocumentId?: string
  createdAt: Date
  updatedAt: Date
}

export type ChargeCreate = Omit<Charge, 'id' | 'createdAt' | 'updatedAt'>

export type ChargeUpdate = Partial<
  Pick<
    Charge,
    | 'providerChargeId'
    | 'paidAt'
    | 'status'
    | 'receiptUrl'
    | 'fiscalDocumentId'
    | 'paymentMethodType'
  >
>
