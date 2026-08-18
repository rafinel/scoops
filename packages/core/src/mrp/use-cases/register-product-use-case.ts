import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductCreatedEvent } from '#mrp/domain/events/product-created-event.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  type ProductActor,
  type RegisterProductInput,
} from '#mrp/domain/structures/index.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
} from '#shared/domain/errors/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = RegisterProductInput & { actor: ProductActor }

export class RegisterProductUseCase implements UseCase<Request, Product> {
  constructor(
    private readonly database: MrpDatabase,
    private readonly broker: Broker,
  ) {}

  async execute(request: Request): Promise<Product> {
    this.validateActor(request.actor)
    this.validateInput(request)

    const product = await this.database.run(async (scope) => {
      const existingProduct = await scope.productsRepository.findByName(
        request.actor.establishmentId,
        request.name.trim(),
      )

      if (existingProduct) {
        throw new ConflictError(
          'Já existe um produto com esse nome neste estabelecimento.',
        )
      }

      const createdProduct = await scope.productsRepository.add({
        establishmentId: request.actor.establishmentId,
        name: request.name.trim(),
        unit: request.unit,
        categories: [...new Set(request.categories)],
        stockControl: request.stockControl,
        status: ProductStatus.Active,
        allowNegativeStock: request.allowNegativeStock ?? false,
        idealStock: request.idealStock,
      })

      if (request.stockControl === ProductStockControl.Single) {
        await scope.stockBalancesRepository.initialize(createdProduct.id)
        if (request.initialStock && request.initialStock > 0) {
          await scope.stockBalancesRepository.adjust({
            establishmentId: request.actor.establishmentId,
            productId: createdProduct.id,
            type: 'entry',
            quantity: request.initialStock,
            performedBy: request.actor.id,
            occurredAt: new Date(),
          })
        }
      } else {
        for (const brand of request.brands ?? []) {
          const createdBrand = await scope.brandsRepository.add({
            productId: createdProduct.id,
            name: brand.name.trim(),
            packageQuantity: brand.packageQuantity,
            packagePrice: brand.packageValue,
            isPrimary: brand.isPrimary,
          })
          await scope.stockBalancesRepository.adjust({
            establishmentId: request.actor.establishmentId,
            productId: createdProduct.id,
            brandId: createdBrand.id,
            type: 'entry',
            quantity: brand.initialQuantity,
            performedBy: request.actor.id,
            occurredAt: new Date(),
          })
        }
      }

      return createdProduct
    })

    await this.broker.publish(
      new ProductCreatedEvent({
        productId: product.id,
        establishmentId: product.establishmentId,
        createdAt: product.createdAt,
      }),
    )

    return product
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem registrar produtos.')
    }
  }

  private validateInput(input: RegisterProductInput): void {
    if (!input.name.trim()) throw new BadRequestError('O nome do produto é obrigatório.')

    if (input.categories.length === 0) {
      throw new BadRequestError('O produto deve possuir pelo menos uma categoria.')
    }

    if (
      input.categories.includes(ProductCategory.Portion) &&
      input.categories.includes(ProductCategory.Resale)
    ) {
      throw new BadRequestError('Porção e Revenda não podem ser usadas juntas.')
    }

    if (
      input.categories.includes(ProductCategory.Manufacturable) &&
      input.stockControl !== ProductStockControl.Single
    ) {
      throw new BadRequestError('Produtos fabricáveis devem usar estoque único.')
    }

    if (input.idealStock === undefined || input.idealStock < 0) {
      throw new BadRequestError(
        'O estoque ideal deve ser informado e não pode ser negativo.',
      )
    }

    if (input.initialStock !== undefined && input.initialStock < 0) {
      throw new BadRequestError('O estoque inicial não pode ser negativo.')
    }

    if (input.stockControl === ProductStockControl.ByBrand) {
      if (!input.brands?.length) {
        throw new BadRequestError(
          'Produtos por marca devem possuir pelo menos uma marca.',
        )
      }

      const initialStock = input.brands.reduce(
        (total, brand) => total + brand.initialQuantity,
        0,
      )
      if (input.initialStock !== undefined && input.initialStock !== initialStock) {
        throw new BadRequestError(
          'O estoque inicial deve corresponder à soma dos estoques das marcas.',
        )
      }
    }

    for (const brand of input.brands ?? []) {
      if (!brand.name.trim()) throw new BadRequestError('O nome da marca é obrigatório.')
      if (
        brand.packageQuantity < 0 ||
        brand.packageValue < 0 ||
        brand.initialQuantity < 0
      ) {
        throw new BadRequestError('Os valores da marca não podem ser negativos.')
      }
    }
  }
}
