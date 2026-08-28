import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'
import type { SalesCatalogListParams } from '#pdv/domain/structures/sales-catalog-list-params.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import {
  AppError,
  AuthorizationError,
  BadRequestError,
  ServiceUnavailableError,
} from '#shared/domain/errors/index.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = Omit<SalesCatalogListParams, 'establishmentId' | 'page' | 'pageSize'> & {
  readonly actor: {
    readonly establishmentId: string
    readonly profile: UserProfile
  }
  readonly kind?: SaleItemKind
  readonly page?: number
  readonly pageSize?: number
}

export class ListOrderCatalogUseCase
  implements UseCase<Request, PaginationResponse<SalesCatalogProduct>>
{
  constructor(private readonly catalog: SalesCatalogProvider) {}

  async execute(request: Request): Promise<PaginationResponse<SalesCatalogProduct>> {
    this.validateActor(request.actor.profile)
    const page = request.page ?? 1
    const pageSize = request.pageSize ?? 20
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 50
    )
      throw new BadRequestError('Os parâmetros de catálogo são inválidos.')
    if (
      request.kind !== undefined &&
      !Object.values({ portion: 'portion', resale: 'resale' }).includes(request.kind)
    )
      throw new BadRequestError('O tipo do catálogo é inválido.')
    const search = request.search?.trim() || undefined
    if (search && search.length > 120)
      throw new BadRequestError('A busca deve ter no máximo 120 caracteres.')

    try {
      return await this.catalog.findMany({
        establishmentId: request.actor.establishmentId,
        search,
        kind: request.kind,
        page,
        pageSize,
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new ServiceUnavailableError(
        'Não foi possível consultar o catálogo de produtos.',
      )
    }
  }

  private validateActor(profile: UserProfile): void {
    if (profile !== UserProfile.Manager && profile !== UserProfile.Operator)
      throw new AuthorizationError(
        'Somente gestores e operadores podem consultar o catálogo.',
      )
  }
}
