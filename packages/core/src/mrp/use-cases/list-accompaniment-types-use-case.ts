import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { AccompanimentTypePage } from '#mrp/domain/structures/accompaniment-type-page.ts'
import type { AccompanimentTypeListParams } from '#mrp/domain/structures/accompaniment-type-list-params.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { AccompanimentTypesRepository } from '#mrp/interfaces/accompaniment-types-repository.ts'
import { AuthorizationError, BadRequestError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = Omit<
  AccompanimentTypeListParams,
  'establishmentId' | 'page' | 'pageSize'
> & {
  readonly actor: ProductActor
  readonly page?: number
  readonly pageSize?: number
}

export class ListAccompanimentTypesUseCase
  implements UseCase<Request, AccompanimentTypePage>
{
  constructor(private readonly repository: AccompanimentTypesRepository) {}

  async execute(request: Request): Promise<AccompanimentTypePage> {
    this.validateActor(request.actor)
    const page = normalizePage(request.page)
    const pageSize = normalizePageSize(request.pageSize)
    const params = {
      establishmentId: request.actor.establishmentId,
      search: request.search?.trim() || undefined,
      page,
      pageSize,
    }
    const result = await this.repository.findPage(params)
    if (result.totalPages > 0 && page > result.totalPages) {
      return this.repository.findPage({ ...params, page: result.totalPages })
    }
    return result
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError(
        'Somente gestores podem consultar tipos de acompanhamento.',
      )
    }
  }
}

function normalizePage(page = 1): number {
  if (!Number.isInteger(page) || page < 1) {
    throw new BadRequestError('A página deve ser um número inteiro positivo.')
  }
  return page
}

function normalizePageSize(pageSize = 10): number {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new BadRequestError('O tamanho da página deve estar entre 1 e 100.')
  }
  return pageSize
}
