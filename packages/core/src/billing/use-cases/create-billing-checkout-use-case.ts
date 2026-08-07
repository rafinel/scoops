import type { BillingCheckoutRequest } from '#billing/domain/structures/billing-checkout-request.ts'
import type { BillingProviderCustomer } from '#billing/domain/structures/billing-provider-customer.ts'
import type { CheckoutSession } from '#billing/domain/structures/checkout-session.ts'
import { SubscriptionStatus } from '#billing/domain/structures/subscription-status.ts'
import type { BillingDatabase } from '#billing/interfaces/billing-database.ts'
import type { BillingProvider } from '#billing/interfaces/billing-provider.ts'
import { ConflictError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

export class CreateBillingCheckoutUseCase
  implements UseCase<BillingCheckoutRequest, CheckoutSession>
{
  constructor(
    private readonly database: BillingDatabase,
    private readonly billingProvider: BillingProvider,
  ) {}

  async execute(request: BillingCheckoutRequest): Promise<CheckoutSession> {
    const context = await this.database.run(async (scope) => {
      const profile = await scope.billingProfilesRepository.findByEstablishmentId(
        request.establishmentId,
      )
      const subscription = await scope.subscriptionsRepository.findByEstablishmentId(
        request.establishmentId,
      )

      if (!profile) throw new NotFoundError('Perfil de faturamento não encontrado.')
      if (!subscription) throw new NotFoundError('Assinatura não encontrada.')

      if (
        subscription.status !== SubscriptionStatus.Trial &&
        subscription.status !== SubscriptionStatus.InitialPaymentPending
      ) {
        throw new ConflictError('A assinatura não pode iniciar uma nova contratação.')
      }

      return {
        subscription,
        customer: this.toProviderCustomer(profile),
      }
    })

    const checkout = await this.billingProvider.createCheckout({
      ...request,
      planCode: context.subscription.planCode,
      customer: context.customer,
    })

    await this.database.run((scope) =>
      scope.subscriptionsRepository.replace(context.subscription.establishmentId, {
        status: SubscriptionStatus.InitialPaymentPending,
      }),
    )

    return checkout
  }

  private toProviderCustomer(profile: {
    holderType: BillingProviderCustomer['holderType']
    holderName: string
    taxId: string
    billingEmail: string
    phone: string
    address: BillingProviderCustomer['address']
  }): BillingProviderCustomer {
    return {
      holderType: profile.holderType,
      name: profile.holderName,
      taxId: profile.taxId,
      email: profile.billingEmail,
      phone: profile.phone,
      address: profile.address,
    }
  }
}
