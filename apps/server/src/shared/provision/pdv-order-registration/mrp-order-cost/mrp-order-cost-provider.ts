import type { Product } from '@scoops/core/mrp/domain/entities'
import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
import type { MrpDatabase, MrpDatabaseRepositories } from '@scoops/core/mrp/interfaces'
import type { OrderCostComponentSnapshot } from '@scoops/core/pdv/domain/structures'
import type { OrderCostProvider } from '@scoops/core/pdv/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { Injectable } from '@nestjs/common'

@Injectable()
export class MrpOrderCostProvider implements OrderCostProvider {
  constructor(private readonly database: MrpDatabase) {}

  resolve(request: Parameters<OrderCostProvider['resolve']>[0]) {
    return this.database.run(async (repositories) => {
      const products = await Promise.all(
        [...new Set(request.lines.map((line) => line.productId))].map((productId) =>
          repositories.productsRepository.findById(request.establishmentId, productId),
        ),
      )
      const ownedProducts = products.filter(
        (product): product is Product => product !== undefined,
      )
      const productsById = new Map(ownedProducts.map((product) => [product.id, product]))

      return Promise.all(
        request.lines.map(async (line, linePosition) => ({
          linePosition,
          components: await this.resolveLine(
            repositories,
            request.establishmentId,
            line,
            productsById,
          ),
        })),
      )
    })
  }

  private async resolveLine(
    repositories: MrpDatabaseRepositories,
    establishmentId: string,
    line: Parameters<OrderCostProvider['resolve']>[0]['lines'][number],
    productsById: ReadonlyMap<string, Product>,
  ): Promise<readonly OrderCostComponentSnapshot[]> {
    const product = productsById.get(line.productId)
    if (!product) return []
    if (product.establishmentId !== establishmentId)
      throw new ConflictError('O produto do pedido pertence a outro estabelecimento.')

    const components: OrderCostComponentSnapshot[] = []
    if (line.kind === 'portion') {
      const size = await repositories.productSizesRepository.findById(
        establishmentId,
        product.id,
        line.sizeId,
      )
      if (
        !size ||
        size.establishmentId !== establishmentId ||
        size.productId !== product.id
      )
        throw new ConflictError('O tamanho do pedido não está mais disponível.')
      components.push(
        this.component(
          'portion-base',
          product.id,
          size.quantity * line.quantity,
          product.currentUnitCost,
        ),
      )

      const links =
        await repositories.productAccompanimentsRepository.findManyByProductId(
          establishmentId,
          product.id,
        )
      for (const accompanimentId of line.accompanimentIds) {
        const link = links.find((candidate) => candidate.id === accompanimentId)
        if (!link || link.establishmentId !== establishmentId)
          throw new ConflictError('O acompanhamento do pedido não está mais disponível.')
        const accompaniment = await repositories.productsRepository.findById(
          establishmentId,
          link.accompanimentProductId,
        )
        if (!accompaniment) {
          components.push(
            this.component(
              'accompaniment',
              link.accompanimentProductId,
              link.quantityPerPortion * line.quantity,
              undefined,
              accompanimentId,
            ),
          )
          continue
        }
        if (accompaniment.establishmentId !== establishmentId)
          throw new ConflictError('O acompanhamento pertence a outro estabelecimento.')
        const unitCost = await this.resolveProductUnitCost(
          repositories,
          establishmentId,
          accompaniment,
        )
        components.push(
          this.component(
            'accompaniment',
            accompaniment.id,
            link.quantityPerPortion * line.quantity,
            unitCost,
            accompanimentId,
          ),
        )
      }
      return components
    }

    const unitCost = await this.resolveProductUnitCost(
      repositories,
      establishmentId,
      product,
      line.brandId,
    )
    components.push(
      this.component(
        line.brandId ? 'resale-brand' : 'resale-product',
        product.id,
        line.quantity,
        unitCost,
        undefined,
        line.brandId,
      ),
    )
    return components
  }

  private async resolveProductUnitCost(
    repositories: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
    brandId?: string,
  ): Promise<number | undefined> {
    if (product.stockControl === ProductStockControl.ByBrand) {
      if (!brandId) return undefined
      const brand = await repositories.brandsRepository.findById(
        establishmentId,
        product.id,
        brandId,
      )
      if (!brand) return undefined
      if (brand.productId !== product.id)
        throw new ConflictError('A marca do pedido é inválida.')
      const unitCost = brand.packagePrice / brand.packageQuantity
      return Number.isFinite(unitCost) && unitCost >= 0 ? unitCost : undefined
    }
    return product.currentUnitCost
  }

  private component(
    kind: OrderCostComponentSnapshot['kind'],
    productId: string,
    quantity: number,
    unitCost: number | undefined,
    accompanimentId?: string,
    brandId?: string,
  ): OrderCostComponentSnapshot {
    const normalizedCost =
      unitCost !== undefined && Number.isFinite(unitCost) && unitCost >= 0
        ? unitCost
        : null
    return {
      kind,
      productId,
      ...(brandId ? { brandId } : {}),
      ...(accompanimentId ? { accompanimentId } : {}),
      quantity,
      unitCost: normalizedCost,
      extendedCostCents:
        normalizedCost === null ? null : Math.round(quantity * normalizedCost * 100),
    }
  }
}
