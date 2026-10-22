import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { AccompanimentPortionCandidate } from '#mrp/domain/structures/accompaniment-portion-candidate.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
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

export class ListAccompanimentPortionCandidatesUseCase
  implements UseCase<Request, readonly AccompanimentPortionCandidate[]>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<readonly AccompanimentPortionCandidate[]> {
    this.validateActor(request.actor)

    return this.database.run((scope) => this.list(scope, request))
  }

  private async list(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<readonly AccompanimentPortionCandidate[]> {
    const establishmentId = request.actor.establishmentId
    const accompanimentProduct = await scope.productsRepository.findById(
      establishmentId,
      request.productId,
    )
    this.validateAccompanimentProduct(accompanimentProduct, establishmentId)

    const [portions, links] = await Promise.all([
      scope.productsRepository.findManyByCategory(
        establishmentId,
        ProductCategory.Portion,
      ),
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
        establishmentId,
        accompanimentProduct.id,
      ),
    ])
    const linkedPortionIds = new Set(links.map((link) => link.productId))

    return portions
      .filter(
        (portion) =>
          portion.establishmentId === establishmentId &&
          !linkedPortionIds.has(portion.id),
      )
      .sort((left, right) => this.compareByName(left, right))
      .map((portion) => ({
        productId: portion.id,
        name: portion.name,
        status: portion.status,
      }))
  }

  private compareByName(left: Product, right: Product): number {
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
        'Somente gestores podem consultar porções disponíveis para vínculo.',
      )
    }
  }

  private validateAccompanimentProduct(
    product: Product | undefined,
    establishmentId: string,
  ): asserts product is Product {
    if (!product || product.establishmentId !== establishmentId) {
      throw new NotFoundError('Produto não encontrado.')
    }
    if (
      !product.categories.includes(ProductCategory.Accompaniment) ||
      product.categories.includes(ProductCategory.Portion)
    ) {
      throw new BadRequestError(
        'O produto não é um acompanhamento elegível para porções.',
      )
    }
  }
}
