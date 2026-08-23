import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompanimentDetails } from '#mrp/domain/structures/product-accompaniment-details.ts'
import type { LinkProductAccompanimentInput } from '#mrp/domain/structures/link-product-accompaniment-input.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { GetProductAccompanimentsUseCase } from '#mrp/use-cases/get-product-accompaniments-use-case.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
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
  readonly input: LinkProductAccompanimentInput
}

export class LinkProductAccompanimentUseCase
  implements UseCase<Request, ProductAccompanimentDetails>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductAccompanimentDetails> {
    this.validateActor(request.actor)
    validateQuantity(request.input.quantityPerPortion)

    return this.database.run(async (scope) => {
      const owner = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      validateOwner(owner, request.actor.establishmentId)
      const target = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.input.accompanimentProductId,
      )
      validateTarget(target, owner.id, request.actor.establishmentId)
      const type = await scope.accompanimentTypesRepository.findById(
        request.actor.establishmentId,
        request.input.accompanimentTypeId,
      )
      if (!type || type.establishmentId !== request.actor.establishmentId) {
        throw new NotFoundError('Tipo de acompanhamento não encontrado.')
      }
      if (target.stockControl === ProductStockControl.ByBrand) {
        await requireMainBrand(scope, target)
      }
      const existing =
        await scope.productAccompanimentsRepository.findByProductAndAccompaniment(
          request.actor.establishmentId,
          owner.id,
          target.id,
        )
      if (existing)
        throw new ConflictError('O acompanhamento já está vinculado a esta porção.')

      const link = await scope.productAccompanimentsRepository.add({
        establishmentId: request.actor.establishmentId,
        productId: owner.id,
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: request.input.quantityPerPortion,
      })
      return GetProductAccompanimentsUseCase.buildDetails(
        scope,
        request.actor.establishmentId,
        link,
      )
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem vincular acompanhamentos.')
    }
  }
}

function validateOwner(
  product: Product | undefined,
  establishmentId: string,
): asserts product is Product {
  if (!product || product.establishmentId !== establishmentId) {
    throw new NotFoundError('Produto não encontrado.')
  }
  if (!product.categories.includes(ProductCategory.Portion)) {
    throw new BadRequestError('O produto não é uma porção.')
  }
}

function validateTarget(
  product: Product | undefined,
  ownerId: string,
  establishmentId: string,
): asserts product is Product {
  if (!product || product.establishmentId !== establishmentId) {
    throw new NotFoundError('Produto de acompanhamento não encontrado.')
  }
  if (product.id === ownerId) {
    throw new BadRequestError('Uma porção não pode acompanhar a si mesma.')
  }
  if (product.status !== ProductStatus.Active) {
    throw new BadRequestError('O produto de acompanhamento deve estar ativo.')
  }
  if (!product.categories.includes(ProductCategory.Accompaniment)) {
    throw new BadRequestError('O produto selecionado não é um acompanhamento.')
  }
}

async function requireMainBrand(
  scope: MrpDatabaseScope,
  product: Product,
): Promise<void> {
  const brands = await scope.brandsRepository.findManyByProductId(product.id)
  if (!brands.some((brand) => brand.isPrimary)) {
    throw new BadRequestError('O acompanhamento não possui marca principal.')
  }
}

export function validateQuantity(quantity: number): void {
  if (
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !hasAtMostThreeDecimalPlaces(quantity)
  ) {
    throw new BadRequestError(
      'A quantidade deve ser positiva e ter até três casas decimais.',
    )
  }
}

function hasAtMostThreeDecimalPlaces(value: number): boolean {
  return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
}
