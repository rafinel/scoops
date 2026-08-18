import type { Product } from '@scoops/core/mrp/domain/entities'
import type { MrpService as MrpRestService } from '@scoops/core/mrp/interfaces'
import type {
  ProductCatalogPage,
  ProductCatalogRow,
  RegisterProductInput,
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
})
