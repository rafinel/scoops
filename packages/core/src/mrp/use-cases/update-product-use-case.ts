import type { Product, ProductUpdate } from '#mrp/domain/entities/product.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import { ProductUpdatedEvent } from '#mrp/domain/events/product-updated-event.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type UpdateProductRequest = {
  establishmentId: string
  productId: string
  changes: ProductUpdate
}

export class UpdateProductUseCase implements UseCase<UpdateProductRequest, Product> {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly broker: Broker,
  ) {}

  async execute(request: UpdateProductRequest): Promise<Product> {
    const { establishmentId, productId, changes } = request
    const product = await this.productsRepository.findById(productId)

    if (!product || product.establishmentId !== establishmentId) {
      throw new NotFoundError('Produto não encontrado.')
    }

    const updatedProduct = { ...product, ...changes }
    this.validate(updatedProduct)

    if (changes.name && changes.name !== product.name) {
      const existingProduct = await this.productsRepository.findByName(
        product.establishmentId,
        changes.name,
      )

      if (existingProduct && existingProduct.id !== product.id) {
        throw new ConflictError(
          'Já existe um produto com esse nome neste estabelecimento.',
        )
      }
    }

    const savedProduct = await this.productsRepository.replace(productId, changes)

    this.broker.publish(
      new ProductUpdatedEvent({
        productId: savedProduct.id,
        establishmentId: savedProduct.establishmentId,
        updatedAt: savedProduct.updatedAt,
      }),
    )

    return savedProduct
  }

  private validate(product: Product): void {
    if (!product.name.trim())
      throw new BadRequestError('O nome do produto é obrigatório.')

    if (product.categories.length === 0) {
      throw new BadRequestError('O produto deve possuir pelo menos uma categoria.')
    }

    if (
      product.categories.includes(ProductCategory.Portion) &&
      product.categories.includes(ProductCategory.Resale)
    ) {
      throw new BadRequestError('Porção e Revenda não podem ser usadas juntas.')
    }

    if (
      product.categories.includes(ProductCategory.Manufacturable) &&
      product.stockControl !== ProductStockControl.Single
    ) {
      throw new BadRequestError('Produtos fabricáveis devem usar estoque único.')
    }

    if (product.idealStock !== undefined && product.idealStock < 0) {
      throw new BadRequestError('O estoque ideal não pode ser negativo.')
    }
  }
}
