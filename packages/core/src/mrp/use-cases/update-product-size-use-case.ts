import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import {
  ProductCategory,
  type ProductPricingDetails,
  type UpdateProductSizeInput,
} from '#mrp/domain/structures/index.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import {
  GetAffectedProductSalesConfigurationsUseCase,
  publishAffectedProductSalesConfigurations,
} from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { GetProductPricingUseCase } from '#mrp/use-cases/get-product-pricing-use-case.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly sizeId: string
  readonly input: UpdateProductSizeInput
}

export class UpdateProductSizeUseCase implements UseCase<Request, ProductPricingDetails> {
  constructor(
    private readonly database: MrpDatabase,
    private readonly broker?: Broker,
  ) {}

  async execute(request: Request): Promise<ProductPricingDetails> {
    this.validateActor(request.actor)
    this.validateInput(request.input)

    let configurations: readonly import('#mrp/domain/structures/product-sales-configuration.ts').ProductSalesConfiguration[] =
      []
    const result = await this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      validatePortionProduct(product, request.actor.establishmentId)

      const size = await scope.productSizesRepository.findById(
        request.actor.establishmentId,
        product.id,
        request.sizeId,
      )
      if (
        !size ||
        size.establishmentId !== request.actor.establishmentId ||
        size.productId !== product.id
      ) {
        throw new NotFoundError('Tamanho não encontrado.')
      }

      const sizes = await scope.productSizesRepository.findManyByProductId(
        request.actor.establishmentId,
        product.id,
      )
      const normalizedName = request.input.name.trim()
      if (
        sizes.some(
          (candidate) =>
            candidate.id !== size.id &&
            normalizeName(candidate.name) === normalizeName(normalizedName),
        )
      ) {
        throw new ConflictError('Já existe um tamanho com esse nome para o produto.')
      }

      if (size.isActive && !request.input.isActive) {
        const activeCount = await scope.productSizesRepository.countActive(
          request.actor.establishmentId,
          product.id,
        )
        if (activeCount <= 1) {
          throw new ConflictError('A porção deve possuir pelo menos um tamanho ativo.')
        }
      }

      await scope.productSizesRepository.replace(
        request.actor.establishmentId,
        product.id,
        size.id,
        {
          name: normalizedName,
          quantity: request.input.quantity,
          price: request.input.price,
          isActive: request.input.isActive,
        },
      )

      const details = await GetProductPricingUseCase.buildDetails(
        scope,
        request.actor.establishmentId,
        product,
      )
      configurations = await new GetAffectedProductSalesConfigurationsUseCase().execute({
        scope,
        establishmentId: request.actor.establishmentId,
        productId: request.productId,
      })
      return details
    })
    await publishAffectedProductSalesConfigurations({
      broker: this.broker,
      establishmentId: request.actor.establishmentId,
      productId: request.productId,
      configurations,
    })
    return result
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem editar tamanhos.')
    }
  }

  private validateInput(input: UpdateProductSizeInput): void {
    if (!input.name.trim() || input.name.trim().length > 120) {
      throw new BadRequestError(
        'O nome do tamanho deve possuir entre 1 e 120 caracteres.',
      )
    }
    if (
      !Number.isFinite(input.quantity) ||
      input.quantity <= 0 ||
      !hasAtMostThreeDecimalPlaces(input.quantity)
    ) {
      throw new BadRequestError(
        'A quantidade deve ser positiva e possuir até três casas decimais.',
      )
    }
    if (
      !Number.isFinite(input.price) ||
      input.price < 0 ||
      !hasAtMostTwoDecimalPlaces(input.price)
    ) {
      throw new BadRequestError(
        'O preço deve ser não negativo e possuir até duas casas decimais.',
      )
    }
    if (typeof input.isActive !== 'boolean') {
      throw new BadRequestError('O status do tamanho é obrigatório.')
    }
  }
}

function validatePortionProduct(
  product: Product | undefined,
  establishmentId: string,
): asserts product is Product {
  if (!product || product.establishmentId !== establishmentId) {
    throw new NotFoundError('Produto não encontrado.')
  }
  if (!product.categories.includes(ProductCategory.Portion)) {
    throw new BadRequestError('O produto não é uma porção.')
  }
  if (product.categories.includes(ProductCategory.Resale)) {
    throw new BadRequestError('Porção e Revenda não podem ser usadas juntas.')
  }
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase()
}

function hasAtMostThreeDecimalPlaces(value: number): boolean {
  return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
}

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
}
