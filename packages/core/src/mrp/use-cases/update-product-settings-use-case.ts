import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ProductSettingsDetails } from '#mrp/domain/structures/product-settings-details.ts'
import type { UpdateProductSettingsInput } from '#mrp/domain/structures/update-product-settings-input.ts'
import { ProductUpdatedEvent } from '#mrp/domain/events/product-updated-event.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly input: UpdateProductSettingsInput
}

export class UpdateProductSettingsUseCase
  implements UseCase<Request, ProductSettingsDetails>
{
  constructor(
    private readonly database: MrpDatabase,
    private readonly broker: Broker,
  ) {}

  async execute(request: Request): Promise<ProductSettingsDetails> {
    this.validateActor(request.actor)
    const input = this.normalizeInput(request.input)

    const product = await this.database.run(async (scope) => {
      const currentProduct = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      if (
        !currentProduct ||
        currentProduct.establishmentId !== request.actor.establishmentId
      ) {
        throw new NotFoundError('Produto não encontrado.')
      }

      this.validateVersion(currentProduct.updatedAt, input.expectedUpdatedAt)

      if (input.name !== undefined && input.name !== currentProduct.name) {
        const existingProduct = await scope.productsRepository.findByName(
          request.actor.establishmentId,
          input.name,
        )
        if (existingProduct && existingProduct.id !== currentProduct.id) {
          throw new ConflictError(
            'Já existe um produto com esse nome neste estabelecimento.',
          )
        }
      }

      const { expectedUpdatedAt: _expectedUpdatedAt, ...changes } = input
      return scope.productsRepository.replace(
        request.actor.establishmentId,
        currentProduct.id,
        changes,
      )
    })

    await this.broker.publish(
      new ProductUpdatedEvent({
        productId: product.id,
        establishmentId: product.establishmentId,
        updatedAt: product.updatedAt,
      }),
    )

    return { product }
  }

  private normalizeInput(input: UpdateProductSettingsInput): UpdateProductSettingsInput {
    const changes = {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.idealStock !== undefined ? { idealStock: input.idealStock } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.allowNegativeStock !== undefined
        ? { allowNegativeStock: input.allowNegativeStock }
        : {}),
      ...(input.internalNotes !== undefined
        ? {
            internalNotes:
              input.internalNotes === null ? null : input.internalNotes.trim(),
          }
        : {}),
    }

    if (Object.keys(changes).length === 0) {
      throw new BadRequestError('Informe pelo menos uma configuração para alterar.')
    }
    if (!(input.expectedUpdatedAt instanceof Date)) {
      throw new BadRequestError('A versão do produto é inválida.')
    }
    if (!Number.isFinite(input.expectedUpdatedAt.getTime())) {
      throw new BadRequestError('A versão do produto é inválida.')
    }
    if (changes.name !== undefined && !changes.name) {
      throw new BadRequestError('O nome do produto é obrigatório.')
    }
    if (changes.name !== undefined && changes.name.length > 120) {
      throw new BadRequestError('O nome do produto deve ter no máximo 120 caracteres.')
    }
    if (
      changes.idealStock !== undefined &&
      changes.idealStock !== null &&
      (!Number.isFinite(changes.idealStock) ||
        changes.idealStock < 0 ||
        !this.hasAtMostThreeDecimalPlaces(changes.idealStock))
    ) {
      throw new BadRequestError(
        'O estoque ideal deve ser não negativo e ter até três casas decimais.',
      )
    }
    if (
      changes.status !== undefined &&
      !Object.values(ProductStatus).includes(changes.status)
    ) {
      throw new BadRequestError('O status do produto é inválido.')
    }
    if (
      changes.allowNegativeStock !== undefined &&
      typeof changes.allowNegativeStock !== 'boolean'
    ) {
      throw new BadRequestError('A política de estoque negativo é inválida.')
    }
    if (changes.internalNotes !== undefined && changes.internalNotes !== null) {
      if (changes.internalNotes.length > 2000) {
        throw new BadRequestError('As observações devem ter no máximo 2000 caracteres.')
      }
    }

    return {
      ...changes,
      expectedUpdatedAt: input.expectedUpdatedAt,
    }
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem alterar as configurações.')
    }
  }

  private validateVersion(currentUpdatedAt: Date, expectedUpdatedAt: Date): void {
    if (currentUpdatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new ConflictError(
        'As configurações do produto foram alteradas. Recarregue e tente novamente.',
      )
    }
  }

  private hasAtMostThreeDecimalPlaces(value: number): boolean {
    return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
  }
}
