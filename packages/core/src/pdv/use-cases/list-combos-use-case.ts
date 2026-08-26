import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Combo } from '#pdv/domain/entities/combo.ts'
import type { ComboActor } from '#pdv/domain/structures/combo-actor.ts'
import type { ComboComponentDetails } from '#pdv/domain/structures/combo-component-details.ts'
import type { ComboDetails } from '#pdv/domain/structures/combo-details.ts'
import type { ComboListParams } from '#pdv/domain/structures/combo-list-params.ts'
import type { DiscountComponent } from '#pdv/domain/structures/discount-component.ts'
import { DiscountStatus } from '#pdv/domain/structures/discount-status.ts'
import { DiscountType } from '#pdv/domain/structures/discount-type.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import {
  AppError,
  AuthorizationError,
  BadRequestError,
  ServiceUnavailableError,
} from '#shared/domain/errors/index.ts'
import { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = Omit<ComboListParams, 'establishmentId' | 'page' | 'pageSize'> & {
  readonly actor: ComboActor
  readonly page?: number
  readonly pageSize?: number
}

export class ListCombosUseCase
  implements UseCase<Request, PaginationResponse<ComboDetails>>
{
  constructor(
    private readonly database: PdvDatabase,
    private readonly catalog: SalesCatalogProvider,
  ) {}

  async execute(request: Request): Promise<PaginationResponse<ComboDetails>> {
    this.validateActor(request.actor)
    const page = request.page ?? 1
    const pageSize = request.pageSize ?? 20
    this.validatePage(page, pageSize)
    const search = request.search?.trim()
    if (search && search.length > 120)
      throw new BadRequestError('A busca deve ter no máximo 120 caracteres.')
    if (request.type !== undefined && !Object.values(DiscountType).includes(request.type))
      throw new BadRequestError('O tipo de desconto é inválido.')
    if (
      request.status !== undefined &&
      !Object.values(DiscountStatus).includes(request.status)
    )
      throw new BadRequestError('O status do combo é inválido.')
    const matchingIds = search
      ? await this.safe(() =>
          this.catalog.findProductIdsByName(request.actor.establishmentId, search),
        )
      : undefined
    const result = await this.database.run((scope) =>
      scope.discountsRepository.findPage(
        {
          establishmentId: request.actor.establishmentId,
          search,
          type: request.type,
          status: request.status,
          page,
          pageSize,
        },
        matchingIds,
      ),
    )
    const products = await this.loadProducts(request.actor.establishmentId, result.items)
    return new PaginationResponse(
      result.items.map((combo) => ListCombosUseCase.details(combo, products)),
      result.page,
      result.pageSize,
      result.total,
      result.totalPages,
    )
  }

  static details(
    combo: Combo,
    products: ReadonlyMap<string, SalesCatalogProduct>,
  ): ComboDetails {
    let normalCents = 0
    const components = combo.components.map((component) => {
      const product = products.get(component.productId)
      const evaluated = ListCombosUseCase.evaluate(component, product)
      const unitCents = evaluated.unitPrice
      const subtotal = ListCombosUseCase.money(unitCents * component.quantity)
      normalCents += subtotal
      return {
        component,
        productName: product?.name ?? 'Produto não encontrado',
        configurationName: evaluated.configurationName,
        accompanimentNames: evaluated.accompanimentNames,
        unitPrice: ListCombosUseCase.money(unitCents),
        subtotal,
        validity: evaluated.valid ? 'valid' : 'invalid',
      } satisfies ComboComponentDetails
    })
    const normalPrice = ListCombosUseCase.money(normalCents)
    return {
      combo,
      components,
      normalPrice,
      savings: ListCombosUseCase.money(normalPrice - combo.fixedPrice),
    }
  }

  static evaluate(
    component: DiscountComponent,
    product?: SalesCatalogProduct,
  ): {
    valid: boolean
    unitPrice: number
    configurationName: string
    accompanimentNames: readonly string[]
  } {
    if (!product?.isActive)
      return {
        valid: false,
        unitPrice: 0,
        configurationName: 'Configuração indisponível',
        accompanimentNames: [],
      }
    if (component.kind === 'portion') {
      const size =
        product.kind === 'portion'
          ? product.sizes.find((candidate) => candidate.sizeId === component.sizeId)
          : undefined
      const accompaniments =
        size?.accompaniments.filter((candidate) =>
          component.accompanimentIds.includes(candidate.accompanimentId),
        ) ?? []
      const valid =
        product.kind === 'portion' &&
        !!size &&
        size.isActive &&
        component.accompanimentIds.length === accompaniments.length &&
        accompaniments.every((item) => item.isActive)
      return {
        valid,
        unitPrice: valid
          ? ListCombosUseCase.money(
              (size?.basePrice ?? 0) +
                accompaniments.reduce(
                  (sum, item) => sum + item.basePrice * item.quantityPerPortion,
                  0,
                ),
            )
          : 0,
        configurationName: size?.name ?? 'Configuração indisponível',
        accompanimentNames: accompaniments.map((item) => item.name),
      }
    }
    const brand = component.brandId
      ? product.resaleBrands.find((candidate) => candidate.brandId === component.brandId)
      : undefined
    const valid =
      product.kind === 'resale' &&
      (product.stockControl === ProductStockControl.Single
        ? !component.brandId && product.resalePrice !== undefined
        : !!brand && brand.isActive)
    return {
      valid,
      unitPrice: valid
        ? ListCombosUseCase.money(brand?.basePrice ?? product.resalePrice ?? 0)
        : 0,
      configurationName: brand?.name ?? 'Preço de revenda',
      accompanimentNames: [],
    }
  }

  static money(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100
  }
  static validateComponents(components: readonly DiscountComponent[]): void {
    if (components.length < 2)
      throw new BadRequestError('O combo deve possuir ao menos dois componentes.')
    const products = new Set<string>()
    for (const component of components) {
      if (!Number.isInteger(component.quantity) || component.quantity < 1)
        throw new BadRequestError(
          'A quantidade do componente deve ser um inteiro positivo.',
        )
      if (!component.productId || products.has(component.productId))
        throw new BadRequestError('Os produtos do combo devem ser distintos.')
      products.add(component.productId)
      if (
        component.kind === 'portion' &&
        new Set(component.accompanimentIds).size !== component.accompanimentIds.length
      )
        throw new BadRequestError('Os acompanhamentos do componente devem ser distintos.')
    }
  }
  static validatePrice(price: number): void {
    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      Math.abs(price * 100 - Math.round(price * 100)) > 1e-8
    )
      throw new BadRequestError(
        'O preço deve ser positivo e ter no máximo duas casas decimais.',
      )
  }
  private async loadProducts(
    establishmentId: string,
    combos: readonly Combo[],
  ): Promise<ReadonlyMap<string, SalesCatalogProduct>> {
    const ids = [
      ...new Set(
        combos.flatMap((combo) =>
          combo.components.map((component) => component.productId),
        ),
      ),
    ]
    if (ids.length === 0) return new Map()
    const products = await this.safe(() =>
      this.catalog.findByProductIds(establishmentId, ids),
    )
    return new Map(
      products
        .filter((product) => product.productId && product)
        .map((product) => [product.productId, product]),
    )
  }
  private async safe<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new ServiceUnavailableError(
        'Não foi possível consultar o catálogo de produtos.',
      )
    }
  }
  private validateActor(actor: ComboActor): void {
    if (actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem gerenciar combos.')
  }
  private validatePage(page: number, pageSize: number): void {
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 50
    )
      throw new BadRequestError('Os parâmetros de paginação são inválidos.')
  }
}
