import type { Product } from '#mrp/domain/entities/product.ts'
import type {
  AdjustProductStockInput,
  ProductCatalogPage,
  ProductBrandStock,
  ProductListParams,
  ProductStockDetails,
  RegisterProductInput,
  RegisterProductBrandInput,
  StockBalance,
  StockTransactionListParams,
  StockTransactionPage,
  UpdateProductBrandInput,
} from '#mrp/domain/structures/index.ts'
import type { RestResponse } from '#shared/responses/rest-response.ts'

export interface MrpService {
  listProducts(
    input: Omit<ProductListParams, 'establishmentId'>,
  ): Promise<RestResponse<ProductCatalogPage>>
  registerProduct(input: RegisterProductInput): Promise<RestResponse<Product>>
  getProductStock(productId: string): Promise<RestResponse<ProductStockDetails>>
  registerProductBrand(
    productId: string,
    input: RegisterProductBrandInput,
  ): Promise<RestResponse<ProductBrandStock>>
  updateProductBrand(
    productId: string,
    brandId: string,
    input: UpdateProductBrandInput,
  ): Promise<RestResponse<ProductBrandStock>>
  setPrimaryProductBrand(
    productId: string,
    brandId: string,
  ): Promise<RestResponse<ProductBrandStock>>
  removeProductBrand(productId: string, brandId: string): Promise<RestResponse<void>>
  adjustProductStock(
    productId: string,
    input: AdjustProductStockInput,
  ): Promise<RestResponse<StockBalance>>
  listStockTransactions(
    productId: string,
    input: StockTransactionListParams,
  ): Promise<RestResponse<StockTransactionPage>>
}
