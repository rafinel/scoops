import type { BillingPaymentMethodChange } from '#billing/domain/structures/billing-payment-method-change.ts'
import type { CheckoutSession } from '#billing/domain/structures/checkout-session.ts'
import type { BillingDatabase } from '#billing/interfaces/billing-database.ts'
import type { BillingProvider } from '#billing/interfaces/billing-provider.ts'
import { ConflictError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

export class ChangePaymentMethodUseCase
  implements UseCase<BillingPaymentMethodChange, CheckoutSession>
{
  constructor(
    private readonly database: BillingDatabase,
    private readonly billingProvider: BillingProvider,
  ) {}

  async execute(request: BillingPaymentMethodChange): Promise<CheckoutSession> {
    const subscription = await this.database.run((scope) =>
      scope.subscriptionsRepository.findByEstablishmentId(request.establishmentId),
    )

    if (!subscription) throw new NotFoundError('Assinatura não encontrada.')
    if (subscription.id !== request.subscriptionId) {
      throw new NotFoundError('Assinatura não encontrada.')
    }
    if (!subscription.providerSubscriptionId) {
      throw new ConflictError('A assinatura ainda não possui cobrança no provedor.')
    }

    return this.billingProvider.changePaymentMethod(request)
  }
}
