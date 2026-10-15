import { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'
import type { OrderPreviewInput } from '#pdv/domain/structures/order-preview.ts'
import { BadRequestError } from '#shared/domain/errors/index.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

export class OrderPreviewInputValidationStrategy
  implements BusinessRuleStrategy<OrderPreviewInput, void>
{
  execute(input: OrderPreviewInput): void {
    if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > 50)
      throw new BadRequestError('O pedido deve possuir entre 1 e 50 itens.')

    for (const line of input.lines) {
      if (!Object.values(SaleItemKind).includes(line.kind))
        throw new BadRequestError('O tipo do item é inválido.')
      if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 999)
        throw new BadRequestError('A quantidade deve estar entre 1 e 999.')
      if (line.kind === 'portion') {
        if (
          !line.sizeId ||
          !Array.isArray(line.accompanimentIds) ||
          new Set(line.accompanimentIds).size !== line.accompanimentIds.length
        )
          throw new BadRequestError('A configuração da porção é inválida.')
      } else if (line.accompanimentIds?.length || line.sizeId) {
        throw new BadRequestError('Revendas não aceitam tamanho ou acompanhamento.')
      }
    }
  }
}
