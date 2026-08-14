import type { Charge } from '#billing/domain/entities/charge.ts'
import type { Subscription } from '#billing/domain/entities/subscription.ts'
import { ChargeFailedEvent } from '#billing/domain/events/charge-failed-event.ts'
import { ChargePaidEvent } from '#billing/domain/events/charge-paid-event.ts'
import { SubscriptionActivatedEvent } from '#billing/domain/events/subscription-activated-event.ts'
import { SubscriptionBlockedEvent } from '#billing/domain/events/subscription-blocked-event.ts'
import { SubscriptionReactivatedEvent } from '#billing/domain/events/subscription-reactivated-event.ts'
import type { BillingProviderEvent } from '#billing/domain/structures/billing-provider-event.ts'
import { ChargeStatus } from '#billing/domain/structures/charge-status.ts'
import { SubscriptionStatus } from '#billing/domain/structures/subscription-status.ts'
import type {
  BillingDatabase,
  BillingDatabaseScope,
} from '#billing/interfaces/billing-database.ts'
import type { BillingProvider } from '#billing/interfaces/billing-provider.ts'
import { NotFoundError } from '#shared/domain/errors/index.ts'
import type { Event } from '#shared/domain/events/event.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

export type ProcessBillingWebhookRequest = {
  readonly headers: Readonly<Record<string, string>>
  readonly body: unknown
}

type WebhookResult = {
  readonly event: Event | undefined
}

export class ProcessBillingWebhookUseCase
  implements UseCase<ProcessBillingWebhookRequest, void>
{
  constructor(
    private readonly database: BillingDatabase,
    private readonly billingProvider: BillingProvider,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly broker: Broker,
  ) {}

  async execute(request: ProcessBillingWebhookRequest): Promise<void> {
    const providerEvent = this.billingProvider.verifyWebhook(
      request.headers,
      request.body,
    )

    const result = await this.database.run(async (scope): Promise<WebhookResult> => {
      if (
        await scope.billingProviderEventsRepository.hasProcessed(providerEvent.eventId)
      ) {
        return { event: undefined }
      }

      const event = await this.handleEvent(scope, providerEvent)
      await scope.billingProviderEventsRepository.markProcessed(
        providerEvent.eventId,
        providerEvent.occurredAt,
      )

      return { event }
    })

    if (result.event) await this.broker.publish(result.event)
  }

  private async handleEvent(
    scope: BillingDatabaseScope,
    providerEvent: BillingProviderEvent,
  ): Promise<Event | undefined> {
    switch (providerEvent.type) {
      case 'subscription.activated':
        return this.handleSubscriptionActivated(scope, providerEvent)
      case 'charge.paid':
        return this.handleChargePaid(scope, providerEvent)
      case 'charge.failed':
        return this.handleChargeStatus(scope, providerEvent, ChargeStatus.Failed)
      case 'charge.overdue':
        return this.handleChargeStatus(scope, providerEvent, ChargeStatus.Overdue)
      case 'charge.refunded':
        return this.handleChargeRefunded(scope, providerEvent)
      case 'charge.chargeback':
        return this.handleChargeChargeback(scope, providerEvent)
      default:
        return undefined
    }
  }

  private async handleSubscriptionActivated(
    scope: BillingDatabaseScope,
    providerEvent: BillingProviderEvent,
  ): Promise<Event> {
    const subscription = await this.findSubscription(scope, providerEvent)
    const currentPeriodStartedAt = this.readDate(providerEvent, 'currentPeriodStartedAt')
    const currentPeriodEndsAt = this.readDate(providerEvent, 'currentPeriodEndsAt')
    const updatedSubscription = await scope.subscriptionsRepository.replace(
      subscription.establishmentId,
      {
        status: SubscriptionStatus.Active,
        trialStartedAt: undefined,
        trialEndsAt: undefined,
        graceEndsAt: undefined,
        cancellationScheduledAt: undefined,
        ...(currentPeriodStartedAt ? { currentPeriodStartedAt } : {}),
        ...(currentPeriodEndsAt ? { currentPeriodEndsAt } : {}),
      },
    )

    return new SubscriptionActivatedEvent({
      subscriptionId: updatedSubscription.id,
      establishmentId: updatedSubscription.establishmentId,
      currentPeriodEndsAt: updatedSubscription.currentPeriodEndsAt,
    })
  }

  private async handleChargePaid(
    scope: BillingDatabaseScope,
    providerEvent: BillingProviderEvent,
  ): Promise<Event> {
    const charge = await this.findCharge(scope, providerEvent)
    const paidAt = this.readDate(providerEvent, 'paidAt') ?? providerEvent.occurredAt
    const receiptUrl = this.readString(providerEvent, 'receiptUrl')
    const updatedCharge = await scope.chargesRepository.replace(charge.id, {
      status: ChargeStatus.Paid,
      paidAt,
      ...(receiptUrl ? { receiptUrl } : {}),
    })
    const subscription = await scope.subscriptionsRepository.findById(
      charge.subscriptionId,
    )

    if (!subscription) throw new NotFoundError('Assinatura da cobrança não encontrada.')

    const wasRestricted =
      subscription.status === SubscriptionStatus.Blocked ||
      subscription.status === SubscriptionStatus.DeletionScheduled ||
      subscription.status === SubscriptionStatus.GracePeriod

    const updatedSubscription = await scope.subscriptionsRepository.replace(
      subscription.establishmentId,
      {
        status: SubscriptionStatus.Active,
        trialStartedAt: undefined,
        trialEndsAt: undefined,
        graceEndsAt: undefined,
        retentionEndsAt: undefined,
      },
    )

    if (wasRestricted) {
      return new SubscriptionReactivatedEvent({
        subscriptionId: updatedSubscription.id,
        establishmentId: updatedSubscription.establishmentId,
        status: updatedSubscription.status,
      })
    }

    return new ChargePaidEvent({
      chargeId: updatedCharge.id,
      establishmentId: updatedCharge.establishmentId,
      paidAt: updatedCharge.paidAt,
    })
  }

  private async handleChargeStatus(
    scope: BillingDatabaseScope,
    providerEvent: BillingProviderEvent,
    status: typeof ChargeStatus.Failed | typeof ChargeStatus.Overdue,
  ): Promise<Event> {
    const charge = await this.findCharge(scope, providerEvent)
    const updatedCharge = await scope.chargesRepository.replace(charge.id, { status })
    const subscription = await scope.subscriptionsRepository.findById(
      charge.subscriptionId,
    )

    if (!subscription) throw new NotFoundError('Assinatura da cobrança não encontrada.')

    const graceEndsAt = new Date(
      this.datetimeProvider.now().getTime() + 7 * 24 * 60 * 60 * 1000,
    )

    await scope.subscriptionsRepository.replace(subscription.establishmentId, {
      status: SubscriptionStatus.GracePeriod,
      graceEndsAt,
    })

    return new ChargeFailedEvent({
      chargeId: updatedCharge.id,
      establishmentId: updatedCharge.establishmentId,
      status: updatedCharge.status,
    })
  }

  private async handleChargeRefunded(
    scope: BillingDatabaseScope,
    providerEvent: BillingProviderEvent,
  ): Promise<Event> {
    const charge = await this.findCharge(scope, providerEvent)
    await scope.chargesRepository.replace(charge.id, {
      status: ChargeStatus.Refunded,
    })
    const subscription = await scope.subscriptionsRepository.findById(
      charge.subscriptionId,
    )

    if (!subscription) throw new NotFoundError('Assinatura da cobrança não encontrada.')

    const retentionEndsAt = new Date(
      this.datetimeProvider.now().getTime() + 90 * 24 * 60 * 60 * 1000,
    )
    const blockedSubscription = await scope.subscriptionsRepository.replace(
      subscription.establishmentId,
      {
        status: SubscriptionStatus.Blocked,
        retentionEndsAt,
      },
    )

    return new SubscriptionBlockedEvent({
      subscriptionId: blockedSubscription.id,
      establishmentId: blockedSubscription.establishmentId,
      status: blockedSubscription.status,
    })
  }

  private async handleChargeChargeback(
    scope: BillingDatabaseScope,
    providerEvent: BillingProviderEvent,
  ): Promise<Event> {
    const charge = await this.findCharge(scope, providerEvent)
    const updatedCharge = await scope.chargesRepository.replace(charge.id, {
      status: ChargeStatus.Chargeback,
    })
    const subscription = await scope.subscriptionsRepository.findById(
      charge.subscriptionId,
    )

    if (!subscription) throw new NotFoundError('Assinatura da cobrança não encontrada.')

    const graceEndsAt = new Date(
      this.datetimeProvider.now().getTime() + 7 * 24 * 60 * 60 * 1000,
    )

    await scope.subscriptionsRepository.replace(subscription.establishmentId, {
      status: SubscriptionStatus.GracePeriod,
      graceEndsAt,
    })

    return new ChargeFailedEvent({
      chargeId: updatedCharge.id,
      establishmentId: updatedCharge.establishmentId,
      status: updatedCharge.status,
    })
  }

  private async findSubscription(
    scope: BillingDatabaseScope,
    providerEvent: BillingProviderEvent,
  ): Promise<Subscription> {
    if (!providerEvent.providerSubscriptionId) {
      throw new NotFoundError('Assinatura do evento não identificada.')
    }

    const subscription = await scope.subscriptionsRepository.findByProviderSubscriptionId(
      providerEvent.providerSubscriptionId,
    )

    if (!subscription) throw new NotFoundError('Assinatura do evento não encontrada.')
    return subscription
  }

  private async findCharge(
    scope: BillingDatabaseScope,
    providerEvent: BillingProviderEvent,
  ): Promise<Charge> {
    if (!providerEvent.providerChargeId) {
      throw new NotFoundError('Cobrança do evento não identificada.')
    }

    const charge = await scope.chargesRepository.findByProviderChargeId(
      providerEvent.providerChargeId,
    )

    if (!charge) throw new NotFoundError('Cobrança do evento não encontrada.')
    return charge
  }

  private readDate(providerEvent: BillingProviderEvent, key: string): Date | undefined {
    const value = this.readPayloadValue(providerEvent, key)
    if (value instanceof Date) return value
    if (typeof value !== 'string' && typeof value !== 'number') return undefined

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date
  }

  private readString(
    providerEvent: BillingProviderEvent,
    key: string,
  ): string | undefined {
    const value = this.readPayloadValue(providerEvent, key)
    return typeof value === 'string' ? value : undefined
  }

  private readPayloadValue(providerEvent: BillingProviderEvent, key: string): unknown {
    if (!providerEvent.payload || typeof providerEvent.payload !== 'object')
      return undefined
    return (providerEvent.payload as Record<string, unknown>)[key]
  }
}
