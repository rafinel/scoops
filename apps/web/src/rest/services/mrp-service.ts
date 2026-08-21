import type { Brand, Product, StockTransaction } from '@scoops/core/mrp/domain/entities'
import type { MrpService as MrpRestService } from '@scoops/core/mrp/interfaces'
import type {
  ProductCatalogPage,
  ProductCatalogRow,
  ProductBrandStock,
  ProductStockDetails,
  RegisterProductInput,
  StockBalance,
  StockTransactionPage,
} from '@scoops/core/mrp/domain/structures'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'
import type { RestClient } from '@scoops/core/shared/interfaces'
import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'

type ProductJson = Omit<Product, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

type ProductCatalogRowJson = Omit<ProductCatalogRow, 'product'> & {
  product: ProductJson
}

type BrandJson = Omit<Brand, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

type ProductBrandStockJson = Omit<ProductBrandStock, 'brand'> & { brand: BrandJson }

type ProductStockDetailsJson = Omit<ProductStockDetails, 'product' | 'brands'> & {
  product: ProductJson
  brands: readonly ProductBrandStockJson[]
}

type StockTransactionJson = Omit<StockTransaction, 'occurredAt'> & {
  occurredAt: string
}

type StockTransactionPageJson = Omit<StockTransactionPage, 'items'> & {
  items: readonly StockTransactionJson[]
}

type ProductCatalogPageJson = {
  items: readonly ProductCatalogRowJson[]
  page: number
  pageSize: number
  total?: number
  totalItems?: number
  totalPages: number
  kpis: ProductCatalogPage['kpis']
}

function mapProduct(product: ProductJson): Product {
  return {
    ...product,
    createdAt: new Date(product.createdAt),
    updatedAt: new Date(product.updatedAt),
  }
}

function mapCatalogPage(response: ProductCatalogPageJson): ProductCatalogPage {
  return Object.assign(
    new PaginationResponse(
      response.items.map((row) => ({ ...row, product: mapProduct(row.product) })),
      response.page,
      response.pageSize,
      response.totalItems ?? response.total ?? 0,
      response.totalPages,
    ),
    { kpis: response.kpis },
  )
}

function mapBrand(brand: BrandJson): Brand {
  return {
    ...brand,
    createdAt: new Date(brand.createdAt),
    updatedAt: new Date(brand.updatedAt),
  }
}

function mapProductStock(response: ProductStockDetailsJson): ProductStockDetails {
  return {
    ...response,
    product: mapProduct(response.product),
    brands: response.brands.map((item) => ({ ...item, brand: mapBrand(item.brand) })),
  }
}

function mapStockTransactionPage(
  response: StockTransactionPageJson,
): StockTransactionPage {
  return {
    ...response,
    items: response.items.map((item) => ({
      ...item,
      occurredAt: new Date(item.occurredAt),
    })),
  }
}

export const MrpService = (restClient: RestClient): MrpRestService => ({
  async listProducts(input) {
    const params = new URLSearchParams()
    if (input.search) params.set('search', input.search)
    input.categories?.forEach((category) => params.append('category', category))
    if (input.status) params.set('status', input.status)
    if (input.stockSituation) params.set('stockSituation', input.stockSituation)
    if (input.sortBy) params.set('sortBy', input.sortBy)
    if (input.sortDirection) params.set('sortDirection', input.sortDirection)
    params.set('page', String(input.page))
    params.set('pageSize', String(input.pageSize))

    const response = await restClient.get<ProductCatalogPageJson>(
      `/products?${params.toString()}`,
    )

    if (!response.isSuccessful) {
      return response as unknown as RestResponse<ProductCatalogPage>
    }

    return new RestResponse({
      body: mapCatalogPage(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async registerProduct(input: RegisterProductInput) {
    const response = await restClient.post<ProductJson>('/products', input)

    if (!response.isSuccessful) return response as unknown as RestResponse<Product>

    return new RestResponse({
      body: mapProduct(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async getProductStock(productId) {
    const response = await restClient.get<ProductStockDetailsJson>(
      `/products/${productId}/stock`,
    )
    if (!response.isSuccessful)
      return response as unknown as RestResponse<ProductStockDetails>

    return new RestResponse({
      body: mapProductStock(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async registerProductBrand(productId, input) {
    const response = await restClient.post<ProductBrandStockJson>(
      `/products/${productId}/brands`,
      input,
    )
    if (!response.isSuccessful)
      return response as unknown as RestResponse<ProductBrandStock>

    return new RestResponse({
      body: { ...response.body, brand: mapBrand(response.body.brand) },
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async updateProductBrand(productId, brandId, input) {
    const response = await restClient.patch<ProductBrandStockJson>(
      `/products/${productId}/brands/${brandId}`,
      input,
    )
    if (!response.isSuccessful)
      return response as unknown as RestResponse<ProductBrandStock>

    return new RestResponse({
      body: { ...response.body, brand: mapBrand(response.body.brand) },
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async setPrimaryProductBrand(productId, brandId) {
    const response = await restClient.patch<ProductBrandStockJson>(
      `/products/${productId}/brands/${brandId}/primary`,
    )
    if (!response.isSuccessful)
      return response as unknown as RestResponse<ProductBrandStock>

    return new RestResponse({
      body: { ...response.body, brand: mapBrand(response.body.brand) },
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  removeProductBrand(productId, brandId) {
    return restClient.delete<void>(`/products/${productId}/brands/${brandId}`)
  },

  adjustProductStock(productId, input) {
    return restClient.post<StockBalance>(
      `/products/${productId}/stock-adjustments`,
      input,
    )
  },

  async listStockTransactions(productId, input) {
    const params = new URLSearchParams({
      page: String(input.page),
      limit: String(input.limit),
    })
    if (input.type) params.set('type', input.type)
    if (input.brandId) params.set('brandId', input.brandId)
    if (input.from) params.set('from', input.from.toISOString())
    if (input.to) params.set('to', input.to.toISOString())

    const response = await restClient.get<StockTransactionPageJson>(
      `/products/${productId}/stock-transactions?${params.toString()}`,
    )
    if (!response.isSuccessful)
      return response as unknown as RestResponse<StockTransactionPage>

    return new RestResponse({
      body: mapStockTransactionPage(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },
})
