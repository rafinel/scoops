import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompanimentCandidate } from '#mrp/domain/structures/product-accompaniment-candidate.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
}

export class ListProductAccompanimentCandidatesUseCase
  implements UseCase<Request, readonly ProductAccompanimentCandidate[]>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<readonly ProductAccompanimentCandidate[]> {
    this.validateActor(request.actor)

    return this.database.run((scope) => this.list(scope, request))
  }

  private async list(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<readonly ProductAccompanimentCandidate[]> {
    const establishmentId = request.actor.establishmentId
    const owner = await scope.productsRepository.findById(
      establishmentId,
      request.productId,
    )
    this.validateOwner(owner, establishmentId)

    const [products, ownerLinks, globals] = await Promise.all([
      scope.productsRepository.findManyByCategory(
        establishmentId,
        ProductCategory.Accompaniment,
      ),
      scope.productAccompanimentsRepository.findManyByProductId(
        establishmentId,
        owner.id,
      ),
      scope.globalAccompanimentsRepository.findManyByEstablishmentId(establishmentId),
    ])
    const presentProductIds = new Set(
      ownerLinks.map((link) => link.accompanimentProductId),
    )
    const eligibleProducts = products
      .filter(
        (product) =>
          product.establishmentId === establishmentId &&
          product.id !== owner.id &&
          product.status === ProductStatus.Active &&
          !product.categories.includes(ProductCategory.Portion) &&
          !presentProductIds.has(product.id),
      )
      .sort((left, right) => this.compareProducts(left, right))

    return Promise.all(
      eligibleProducts.map((product) =>
        this.toCandidate(
          scope,
          establishmentId,
          product,
          globals.find((global) => global.accompanimentProductId === product.id),
        ),
      ),
    )
  }

  private async toCandidate(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
    global: GlobalAccompaniment | undefined,
  ): Promise<ProductAccompanimentCandidate> {
    const hasPortionLinks =
      global === undefined &&
      (await scope.productAccompanimentsRepository.countByAccompanimentProductId(
        establishmentId,
        product.id,
      )) > 0
    return {
      productId: product.id,
      name: product.name,
      unit: product.unit,
      stockControl: product.stockControl,
      accompanimentPrice:
        (global ? global.accompanimentPrice : product.accompanimentPrice) ?? null,
      isGlobal: global !== undefined,
      hasPortionLinks,
      ...(global
        ? {
            global: {
              accompanimentTypeId: global.accompanimentTypeId,
              quantityPerPortion: global.quantityPerPortion,
            },
          }
        : {}),
    }
  }

  private compareProducts(left: Product, right: Product): number {
    return (
      this.normalizeForSort(left.name).localeCompare(this.normalizeForSort(right.name)) ||
      left.id.localeCompare(right.id)
    )
  }

  private normalizeForSort(value: string): string {
    return value.trim().toLocaleLowerCase()
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError(
        'Somente gestores podem consultar candidatos a acompanhamento.',
      )
    }
  }

  private validateOwner(
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
}
