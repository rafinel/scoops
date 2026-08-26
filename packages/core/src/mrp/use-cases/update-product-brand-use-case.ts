import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ProductBrandStock } from '#mrp/domain/structures/product-brand-stock.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import type { UpdateProductBrandInput } from '#mrp/domain/structures/update-product-brand-input.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import {
  GetAffectedProductSalesConfigurationsUseCase,
  publishAffectedProductSalesConfigurations,
} from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  actor: ProductActor
  productId: string
  brandId: string
  input: UpdateProductBrandInput
}

export class UpdateProductBrandUseCase implements UseCase<Request, ProductBrandStock> {
  constructor(
    private readonly database: MrpDatabase,
    private readonly broker?: Broker,
  ) {}

  async execute(request: Request): Promise<ProductBrandStock> {
    this.validateActor(request.actor)
    this.validateInput(request.input)
    let configurations: readonly import('#mrp/domain/structures/product-sales-configuration.ts').ProductSalesConfiguration[] =
      []
    const result = await this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      if (!product) throw new NotFoundError('Produto não encontrado.')
      if (product.stockControl !== ProductStockControl.ByBrand)
        throw new BadRequestError('Este produto não utiliza estoque por marca.')
      const brand = await scope.brandsRepository.findById(product.id, request.brandId)
      if (!brand) throw new NotFoundError('Marca não encontrada.')
      const name = request.input.name.trim()
      const duplicate = await scope.brandsRepository.findByName(product.id, name)
      if (duplicate && duplicate.id !== brand.id)
        throw new ConflictError('Já existe uma marca com esse nome para o produto.')
      const savedBrand = await scope.brandsRepository.replace(product.id, brand.id, {
        name,
        unit: request.input.unit ?? brand.unit,
        packageQuantity: request.input.packageQuantity,
        packagePrice: request.input.packageValue,
      })
      const balance = await scope.stockBalancesRepository.findByProductAndBrand(
        product.id,
        brand.id,
      )
      configurations = await new GetAffectedProductSalesConfigurationsUseCase().execute({
        scope,
        establishmentId: request.actor.establishmentId,
        productId: request.productId,
      })
      return {
        brand: savedBrand,
        stockQuantity: balance?.quantity ?? 0,
        unitPrice: savedBrand.packagePrice / savedBrand.packageQuantity,
      }
    })
    await publishAffectedProductSalesConfigurations({
      broker: this.broker,
      establishmentId: request.actor.establishmentId,
      productId: request.productId,
      configurations,
    })
    return result
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem alterar marcas.')
  }

  private validateInput(input: UpdateProductBrandInput): void {
    if (!input.name.trim() || input.name.trim().length > 120)
      throw new BadRequestError('O nome da marca deve possuir entre 1 e 120 caracteres.')
    if (!Number.isFinite(input.packageQuantity) || input.packageQuantity <= 0)
      throw new BadRequestError('A quantidade por embalagem deve ser maior que zero.')
    if (!Number.isFinite(input.packageValue) || input.packageValue < 0)
      throw new BadRequestError('O valor da embalagem não pode ser negativo.')
    if (input.unit !== undefined && !Object.values(ProductUnit).includes(input.unit))
      throw new BadRequestError('A unidade da marca é inválida.')
  }
}
