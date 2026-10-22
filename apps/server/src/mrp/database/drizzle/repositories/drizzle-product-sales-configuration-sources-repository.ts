import type {
  AccompanimentType,
  Brand,
  GlobalAccompaniment,
  Product,
  ProductAccompaniment,
  ProductSize,
  ResaleConfiguration,
} from '@scoops/core/mrp/domain/entities'
import type { ProductSalesConfigurationSource } from '@scoops/core/mrp/domain/structures'
import type { ProductSalesConfigurationSourcesRepository } from '@scoops/core/mrp/interfaces'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleAccompanimentTypeMapper } from '../mappers/drizzle-accompaniment-type-mapper'
import { DrizzleBrandMapper } from '../mappers/drizzle-brand-mapper'
import { DrizzleGlobalAccompanimentMapper } from '../mappers/drizzle-global-accompaniment-mapper'
import { DrizzleProductAccompanimentMapper } from '../mappers/drizzle-product-accompaniment-mapper'
import { DrizzleProductMapper } from '../mappers/drizzle-product-mapper'
import { DrizzleProductSizeMapper } from '../mappers/drizzle-product-size-mapper'
import { DrizzleResaleConfigurationMapper } from '../mappers/drizzle-resale-configuration-mapper'
import { accompanimentTypeModel } from '../models/accompaniment-type-model'
import { globalAccompanimentModel } from '../models/global-accompaniment-model'
import { productAccompanimentModel } from '../models/product-accompaniment-model'
import { productBrandModel } from '../models/product-brand-model'
import { productModel } from '../models/product-model'
import { productSizeModel } from '../models/product-size-model'
import { resaleConfigurationModel } from '../models/resale-configuration-model'

type ProductChildren = {
  readonly sizes: readonly ProductSize[]
  readonly links: readonly ProductAccompaniment[]
  readonly resaleConfigurations: readonly ResaleConfiguration[]
  readonly brands: readonly Brand[]
}

type ProductLookups = {
  readonly accompanimentProducts: readonly Product[]
  readonly accompanimentTypes: readonly AccompanimentType[]
  readonly globals: readonly GlobalAccompaniment[]
}

@Injectable()
export class DrizzleProductSalesConfigurationSourcesRepository
  extends DrizzleRepository
  implements ProductSalesConfigurationSourcesRepository
{
  async findManyByProductIds(
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<readonly ProductSalesConfigurationSource[]> {
    const requestedIds = [...new Set(productIds)]
    if (requestedIds.length === 0) return []

    const products = await this.findProducts(establishmentId, requestedIds)
    if (products.length === 0) return []

    const children = await this.findChildren(
      establishmentId,
      products.map((product) => product.id),
    )
    const accompanimentProducts = await this.findAccompanimentProducts(
      establishmentId,
      children.links,
    )
    const accompanimentTypes = await this.findAccompanimentTypes(
      establishmentId,
      children.links,
    )
    const globals = await this.findGlobals(establishmentId, children.links)
    const productsById = new Map(products.map((product) => [product.id, product]))

    return requestedIds.flatMap((productId) => {
      const product = productsById.get(productId)
      if (!product) return []
      return [
        this.toSource(product, children, {
          accompanimentProducts,
          accompanimentTypes,
          globals,
        }),
      ]
    })
  }

  private async findProducts(
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<readonly Product[]> {
    const records = await this.database
      .select()
      .from(productModel)
      .where(
        and(
          eq(productModel.establishmentId, establishmentId),
          inArray(productModel.id, [...productIds]),
        ),
      )
    return records.map(DrizzleProductMapper.toDomain)
  }

  private async findChildren(
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<ProductChildren> {
    const [sizes, links, resaleConfigurations, brands] = await Promise.all([
      this.findSizes(establishmentId, productIds),
      this.findLinks(establishmentId, productIds),
      this.findResaleConfigurations(establishmentId, productIds),
      this.findBrands(productIds),
    ])
    return { sizes, links, resaleConfigurations, brands }
  }

  private async findSizes(
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<readonly ProductSize[]> {
    const records = await this.database
      .select()
      .from(productSizeModel)
      .where(
        and(
          eq(productSizeModel.establishmentId, establishmentId),
          inArray(productSizeModel.productId, [...productIds]),
        ),
      )
      .orderBy(asc(productSizeModel.name), asc(productSizeModel.id))
    return records.map(DrizzleProductSizeMapper.toDomain)
  }

  private async findLinks(
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<readonly ProductAccompaniment[]> {
    const records = await this.database
      .select()
      .from(productAccompanimentModel)
      .where(
        and(
          eq(productAccompanimentModel.establishmentId, establishmentId),
          inArray(productAccompanimentModel.productId, [...productIds]),
        ),
      )
      .orderBy(asc(productAccompanimentModel.id))
    return records.map(DrizzleProductAccompanimentMapper.toDomain)
  }

  private async findResaleConfigurations(
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<readonly ResaleConfiguration[]> {
    const records = await this.database
      .select()
      .from(resaleConfigurationModel)
      .where(
        and(
          eq(resaleConfigurationModel.establishmentId, establishmentId),
          inArray(resaleConfigurationModel.productId, [...productIds]),
        ),
      )
      .orderBy(asc(resaleConfigurationModel.id))
    return records.map(DrizzleResaleConfigurationMapper.toDomain)
  }

  private async findBrands(productIds: readonly string[]): Promise<readonly Brand[]> {
    const records = await this.database
      .select()
      .from(productBrandModel)
      .where(inArray(productBrandModel.productId, [...productIds]))
      .orderBy(asc(productBrandModel.name))
    return records.map(DrizzleBrandMapper.toDomain)
  }

  private async findAccompanimentProducts(
    establishmentId: string,
    links: readonly ProductAccompaniment[],
  ): Promise<readonly Product[]> {
    const ids = [...new Set(links.map((link) => link.accompanimentProductId))]
    if (ids.length === 0) return []
    return this.findProducts(establishmentId, ids)
  }

  private async findAccompanimentTypes(
    establishmentId: string,
    links: readonly ProductAccompaniment[],
  ): Promise<readonly AccompanimentType[]> {
    const ids = [...new Set(links.map((link) => link.accompanimentTypeId))]
    if (ids.length === 0) return []
    const records = await this.database
      .select()
      .from(accompanimentTypeModel)
      .where(
        and(
          eq(accompanimentTypeModel.establishmentId, establishmentId),
          inArray(accompanimentTypeModel.id, ids),
        ),
      )
    return records.map(DrizzleAccompanimentTypeMapper.toDomain)
  }

  private async findGlobals(
    establishmentId: string,
    links: readonly ProductAccompaniment[],
  ): Promise<readonly GlobalAccompaniment[]> {
    const ids = [
      ...new Set(
        links.flatMap((link) =>
          link.globalAccompanimentId ? [link.globalAccompanimentId] : [],
        ),
      ),
    ]
    if (ids.length === 0) return []
    const records = await this.database
      .select()
      .from(globalAccompanimentModel)
      .where(
        and(
          eq(globalAccompanimentModel.establishmentId, establishmentId),
          inArray(globalAccompanimentModel.id, ids),
        ),
      )
    return records.map(DrizzleGlobalAccompanimentMapper.toDomain)
  }

  private toSource(
    product: Product,
    children: ProductChildren,
    lookups: ProductLookups,
  ): ProductSalesConfigurationSource {
    const links = children.links.filter((link) => link.productId === product.id)
    const accompanimentProductIds = new Set(
      links.map((link) => link.accompanimentProductId),
    )
    const accompanimentTypeIds = new Set(links.map((link) => link.accompanimentTypeId))
    const globalIds = new Set(
      links.flatMap((link) =>
        link.globalAccompanimentId ? [link.globalAccompanimentId] : [],
      ),
    )

    return {
      product,
      sizes: children.sizes.filter((size) => size.productId === product.id),
      links,
      resaleConfigurations: children.resaleConfigurations.filter(
        (configuration) => configuration.productId === product.id,
      ),
      brands: children.brands.filter((brand) => brand.productId === product.id),
      accompanimentProducts: lookups.accompanimentProducts.filter((accompaniment) =>
        accompanimentProductIds.has(accompaniment.id),
      ),
      accompanimentTypes: lookups.accompanimentTypes.filter((type) =>
        accompanimentTypeIds.has(type.id),
      ),
      globals: lookups.globals.filter((global) => globalIds.has(global.id)),
    }
  }
}
