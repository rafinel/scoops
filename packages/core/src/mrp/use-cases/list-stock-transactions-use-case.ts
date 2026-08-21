import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { StockTransactionListParams } from '#mrp/domain/structures/stock-transaction-list-params.ts'
import type { StockTransactionPage } from '#mrp/domain/structures/stock-transaction-page.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import type { StockTransactionsRepository } from '#mrp/interfaces/stock-transactions-repository.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  actor: ProductActor
  productId: string
  params: StockTransactionListParams
}

export class ListStockTransactionsUseCase
  implements UseCase<Request, StockTransactionPage>
{
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly stockTransactionsRepository: StockTransactionsRepository,
  ) {}

  async execute(request: Request): Promise<StockTransactionPage> {
    this.validateActor(request.actor)
    this.validateParams(request.params)
    const product = await this.productsRepository.findById(
      request.actor.establishmentId,
      request.productId,
    )
    if (!product) throw new NotFoundError('Produto não encontrado.')
    return this.stockTransactionsRepository.findPage(
      request.actor.establishmentId,
      product.id,
      request.params,
    )
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager)
      throw new AuthorizationError(
        'Somente gestores podem consultar o histórico de estoque.',
      )
  }

  private validateParams(params: StockTransactionListParams): void {
    if (!Number.isInteger(params.page) || params.page < 1)
      throw new BadRequestError('A página deve ser maior ou igual a um.')
    if (!Number.isInteger(params.limit) || params.limit < 1 || params.limit > 100)
      throw new BadRequestError('O limite deve estar entre 1 e 100.')
    if (params.from && params.to && params.from > params.to)
      throw new BadRequestError('A data inicial não pode ser posterior à data final.')
  }
}
