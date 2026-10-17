import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { ProductAccompanimentDetails } from '#mrp/domain/structures/product-accompaniment-details.ts'
import type { LinkProductAccompanimentInput } from '#mrp/domain/structures/link-product-accompaniment-input.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { AccompanimentPriceValidationStrategy } from '#mrp/domain/strategies/accompaniment-price-validation-strategy.ts'
import {
  GetAffectedProductSalesConfigurationsUseCase,
  publishAffectedProductSalesConfigurations,
} from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
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

type LinkContext = {
  readonly owner: Product
  readonly target: Product
  readonly accompanimentTypeId: string
}

export class LinkProductAccompanimentUseCase
  implements UseCase<Request, ProductAccompanimentDetails>
{
  private readonly accompanimentPriceValidation =
    new AccompanimentPriceValidationStrategy()
  private readonly getAffectedProductSalesConfigurations =
    new GetAffectedProductSalesConfigurationsUseCase()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductAccompanimentDetails> {
    this.validateActor(request.actor)
    this.validateQuantity(request.input.quantityPerPortion)

    return this.database.run((scope) => this.link(scope, request))
  }

  private async link(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<ProductAccompanimentDetails> {
    const establishmentId = request.actor.establishmentId
    const { owner, target, accompanimentTypeId } = await this.resolveLinkContext(
      scope,
      request,
    )
    const savedTarget = await this.saveAccompanimentPrice(
      scope,
      target,
      request.input.accompanimentPrice,
    )
    const link = await scope.productAccompanimentsRepository.add({
      establishmentId,
      productId: owner.id,
      accompanimentProductId: savedTarget.id,
      accompanimentTypeId,
      quantityPerPortion: request.input.quantityPerPortion,
    })

    const result = await this.buildDetails(scope, establishmentId, link)
    const affectedProductIds =
      savedTarget.accompanimentPrice === target.accompanimentPrice ? [] : undefined
    const configurations = await this.getAffectedProductSalesConfigurations.execute({
      scope,
      establishmentId,
      productId: owner.id,
      affectedProductIds,
      accompanimentProductIdForInverseLookup:
        affectedProductIds === undefined ? savedTarget.id : undefined,
    })
    await publishAffectedProductSalesConfigurations({
      scope,
      establishmentId,
      productId: owner.id,
      configurations: configurations.filter((configuration) =>
        configuration.categories.includes(ProductCategory.Portion),
      ),
    })
    return result
  }

  private async resolveLinkContext(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<LinkContext> {
    const establishmentId = request.actor.establishmentId
    const owner = await scope.productsRepository.findById(
      establishmentId,
      request.productId,
    )
    this.validateOwner(owner, establishmentId)
    const target = await scope.productsRepository.findById(
      establishmentId,
      request.input.accompanimentProductId,
    )
    this.validateTarget(target, owner.id, establishmentId)
    const type = await scope.accompanimentTypesRepository.findById(
      establishmentId,
      request.input.accompanimentTypeId,
    )
    if (!type || type.establishmentId !== establishmentId) {
      throw new NotFoundError('Tipo de acompanhamento não encontrado.')
    }
    if (target.stockControl === ProductStockControl.ByBrand) {
      await this.requireMainBrand(scope, target)
    }
    const existing =
      await scope.productAccompanimentsRepository.findByProductAndAccompaniment(
        establishmentId,
        owner.id,
        target.id,
      )
    if (existing)
      throw new ConflictError('O acompanhamento já está vinculado a esta porção.')
    this.validateAccompanimentPrice(
      request.input.accompanimentPrice ?? target.accompanimentPrice,
    )
    return { owner, target, accompanimentTypeId: type.id }
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem vincular acompanhamentos.')
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

  private validateTarget(
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
    if (
      !product.categories.includes(ProductCategory.Accompaniment) ||
      product.categories.includes(ProductCategory.Portion)
    ) {
      throw new BadRequestError('O produto selecionado não é um acompanhamento elegível.')
    }
  }

  private validateQuantity(quantity: number): void {
    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !this.hasAtMostThreeDecimalPlaces(quantity)
    ) {
      throw new BadRequestError(
        'A quantidade deve ser positiva e ter até três casas decimais.',
      )
    }
  }

  private hasAtMostThreeDecimalPlaces(value: number): boolean {
    return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
  }

  private async saveAccompanimentPrice(
    scope: MrpDatabaseRepositories,
    target: Product,
    suppliedPrice: number | undefined,
  ): Promise<Product> {
    if (suppliedPrice === undefined || suppliedPrice === target.accompanimentPrice)
      return target
    return scope.productsRepository.replace(target.establishmentId, target.id, {
      accompanimentPrice: suppliedPrice,
    })
  }

  private validateAccompanimentPrice(price: number | undefined): void {
    const result = this.accompanimentPriceValidation.execute(price)
    if (typeof result === 'number') return
    throw new BadRequestError(
      result === 'missing'
        ? 'Informe o preço de venda do acompanhamento.'
        : 'O preço deve ser maior ou igual a zero e ter até duas casas decimais.',
    )
  }

  private async requireMainBrand(
    scope: MrpDatabaseRepositories,
    product: Product,
  ): Promise<void> {
    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    if (!brands.some((brand) => brand.productId === product.id && brand.isPrimary)) {
      throw new BadRequestError('O acompanhamento não possui marca principal.')
    }
  }

  private async buildDetails(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    link: ProductAccompaniment,
  ): Promise<ProductAccompanimentDetails> {
    const target = await scope.productsRepository.findById(
      establishmentId,
      link.accompanimentProductId,
    )
    if (!target || target.establishmentId !== establishmentId) {
      throw new NotFoundError('Produto de acompanhamento não encontrado.')
    }
    const type = await scope.accompanimentTypesRepository.findById(
      establishmentId,
      link.accompanimentTypeId,
    )
    if (!type || type.establishmentId !== establishmentId) {
      throw new NotFoundError('Tipo de acompanhamento não encontrado.')
    }
    const source = await this.resolveCurrentSource(scope, target)
    return {
      id: link.id,
      accompanimentProductId: target.id,
      accompanimentProductName: target.name,
      accompanimentTypeId: type.id,
      accompanimentTypeName: type.name,
      unit: target.unit,
      quantityPerPortion: link.quantityPerPortion,
      salePrice: target.accompanimentPrice ?? null,
      isGlobal: link.globalAccompanimentId !== undefined,
      hasOtherPortionLinks: false,
      ...(source?.brandId ? { brandId: source.brandId } : {}),
      ...(source?.brandName ? { brandName: source.brandName } : {}),
      ...(source?.unitCost !== undefined ? { unitCost: source.unitCost } : {}),
      ...(source?.unitCost !== undefined
        ? { estimatedCost: link.quantityPerPortion * source.unitCost }
        : {}),
    }
  }

  private async resolveCurrentSource(
    scope: MrpDatabaseRepositories,
    product: Product,
  ): Promise<{ brandId?: string; brandName?: string; unitCost?: number } | undefined> {
    if (
      product.status !== ProductStatus.Active ||
      !product.categories.includes(ProductCategory.Accompaniment)
    ) {
      return undefined
    }
    if (product.stockControl === ProductStockControl.Single) {
      return product.currentUnitCost === undefined
        ? undefined
        : { unitCost: product.currentUnitCost }
    }
    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    const mainBrand = brands.find(
      (brand) => brand.productId === product.id && brand.isPrimary,
    )
    if (!mainBrand || mainBrand.packageQuantity <= 0) return undefined
    return {
      brandId: mainBrand.id,
      brandName: mainBrand.name,
      unitCost: mainBrand.packagePrice / mainBrand.packageQuantity,
    }
  }
}
