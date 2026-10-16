import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import type {
  OrderPreview,
  OrderPreviewFacts,
  OrderPreviewInput,
} from '#pdv/domain/structures/order-preview.ts'
import type { SalesChannelSnapshot } from '#pdv/domain/structures/sales-channel-snapshot.ts'
import type { OrderRegistrationInvalidConfiguration } from '#pdv/domain/structures/order-registration-invalid-configuration.ts'
import { OrderCartPricingStrategy } from '#pdv/domain/strategies/order-cart-pricing-strategy.ts'
import { OrderPreviewAccompanimentPriceSnapshotStrategy } from '#pdv/domain/strategies/order-preview-accompaniment-price-snapshot-strategy.ts'
import { OrderPreviewInputValidationStrategy } from '#pdv/domain/strategies/order-preview-input-validation-strategy.ts'
import type { DiscountsRepository } from '#pdv/interfaces/discounts-repository.ts'
import type { OrderPreviewTokenService } from '#pdv/interfaces/order-preview-token-service.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = OrderPreviewInput & {
  readonly actor: {
    readonly establishmentId: string
    readonly profile: UserProfile
  }
}

export class PreviewOrderUseCase implements UseCase<Request, OrderPreview> {
  private readonly cartPricing = new OrderCartPricingStrategy()
  private readonly accompanimentPriceSnapshot =
    new OrderPreviewAccompanimentPriceSnapshotStrategy()
  private readonly inputValidation = new OrderPreviewInputValidationStrategy()

  constructor(
    private readonly catalog: SalesCatalogProvider,
    private readonly salesChannels: SalesChannelsRepository,
    private readonly discounts: DiscountsRepository,
    private readonly tokenService: OrderPreviewTokenService,
  ) {}

  async execute(request: Request): Promise<OrderPreview> {
    this.validateActor(request.actor.profile)
    this.inputValidation.execute(request)

    const products = await this.catalog.findByProductIds(
      request.actor.establishmentId,
      request.lines.map((line) => line.productId),
    )
    const channel = await this.findChannel(
      request.actor.establishmentId,
      request.channelId,
    )
    const combos = await this.discounts.findActive(request.actor.establishmentId)
    const issues = this.cartPricing.execute({
      input: request,
      products,
      channel,
      combos,
      establishmentId: request.actor.establishmentId,
    })
    this.rejectInvalidConfigurations(issues.invalidConfigurations)

    const facts = this.toFacts(issues.cart, channel, products)
    return {
      cart: facts.cart,
      ...(facts.channel ? { channel: facts.channel } : {}),
      previewToken: this.tokenService.issue(
        this.toInput(request),
        request.actor.establishmentId,
        facts,
      ),
    }
  }

  private async findChannel(
    establishmentId: string,
    channelId: string | undefined,
  ): Promise<SalesChannel | undefined> {
    if (!channelId) return undefined
    const channel = await this.salesChannels.findById(establishmentId, channelId)
    if (!channel || channel.establishmentId !== establishmentId)
      throw new NotFoundError('Canal de venda não encontrado.')
    if (channel.status !== SalesChannelStatus.Active)
      throw new BadRequestError('O canal de venda selecionado está inativo.')
    return channel
  }

  private toFacts(
    cart: ReturnType<OrderCartPricingStrategy['execute']>['cart'],
    channel: SalesChannel | undefined,
    products: Awaited<ReturnType<SalesCatalogProvider['findByProductIds']>>,
  ): OrderPreviewFacts {
    const snapshot: SalesChannelSnapshot | undefined = channel
      ? {
          channelId: channel.id,
          name: channel.name,
          percentage: channel.percentage,
        }
      : undefined
    return {
      cart,
      ...(snapshot ? { channel: snapshot } : {}),
      selectedAccompanimentPrices: this.accompanimentPriceSnapshot.execute({
        cart,
        products,
      }),
    }
  }

  private toInput(request: Request): OrderPreviewInput {
    return {
      ...(request.channelId ? { channelId: request.channelId } : {}),
      lines: request.lines,
    }
  }

  private rejectInvalidConfigurations(
    invalidConfigurations: readonly OrderRegistrationInvalidConfiguration[],
  ): void {
    if (invalidConfigurations.length > 0)
      throw new BadRequestError('A configuração selecionada não está disponível.')
  }

  private validateActor(profile: UserProfile): void {
    if (profile !== UserProfile.Manager && profile !== UserProfile.Operator)
      throw new AuthorizationError('Acesso não autorizado para prévias de pedidos.')
  }
}
