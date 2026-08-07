import type { Product, ProductCreate } from '#mrp/domain/entities/product.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import { ProductCreatedEvent } from '#mrp/domain/events/product-created-event.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import { ConflictError, BadRequestError } from '#shared/domain/errors/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

export class CreateProductUseCase implements UseCase<ProductCreate, Product> {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly broker: Broker,
  ) {}

  async execute(request: ProductCreate): Promise<Product> {
    this.validate(request)

    const existingProduct = await this.productsRepository.findByName(
      request.establishmentId,
      request.name,
    )

    if (existingProduct) {
      throw new ConflictError('Já existe um produto com esse nome neste estabelecimento.')
    }

    const product = await this.productsRepository.add(request)

    this.broker.publish(
      new ProductCreatedEvent({
        productId: product.id,
        establishmentId: product.establishmentId,
        createdAt: product.createdAt,
      }),
    )

    return product
  }

  private validate(request: ProductCreate): void {
    if (!request.name.trim())
      throw new BadRequestError('O nome do produto é obrigatório.')

    if (request.categories.length === 0) {
      throw new BadRequestError('O produto deve possuir pelo menos uma categoria.')
    }

    if (
      request.categories.includes(ProductCategory.Portion) &&
      request.categories.includes(ProductCategory.Resale)
    ) {
      throw new BadRequestError('Porção e Revenda não podem ser usadas juntas.')
    }

    if (
      request.categories.includes(ProductCategory.Manufacturable) &&
      request.stockControl !== ProductStockControl.Single
    ) {
      throw new BadRequestError('Produtos fabricáveis devem usar estoque único.')
    }

    if (request.idealStock !== undefined && request.idealStock < 0) {
      throw new BadRequestError('O estoque ideal não pode ser negativo.')
    }
  }
}
