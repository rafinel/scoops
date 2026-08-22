import type { Product } from '#mrp/domain/entities/product.ts'
import type { Production } from '#mrp/domain/entities/production.ts'
import type {
  AdjustProductStockInput,
  ProductCatalogPage,
  ProductBrandStock,
  ProductListParams,
  ProductStockDetails,
  ProductRecipeDetails,
  AddRecipeIngredientInput,
  ProductionPreview,
  ProductionRequest,
  RegisterProductInput,
  RegisterProductBrandInput,
  StockBalance,
  StockTransactionListParams,
  StockTransactionPage,
  SaveRecipeYieldInput,
  UpdateRecipeIngredientInput,
  UpdateProductBrandInput,
} from '#mrp/domain/structures/index.ts'
import type { RestResponse } from '#shared/responses/rest-response.ts'

export interface MrpService {
  listProducts(
    input: Omit<ProductListParams, 'establishmentId'>,
  ): Promise<RestResponse<ProductCatalogPage>>
  registerProduct(input: RegisterProductInput): Promise<RestResponse<Product>>
  getProductStock(productId: string): Promise<RestResponse<ProductStockDetails>>
  getProductRecipe(productId: string): Promise<RestResponse<ProductRecipeDetails>>
  saveRecipeYield(
    productId: string,
    input: SaveRecipeYieldInput,
  ): Promise<RestResponse<ProductRecipeDetails>>
  addRecipeIngredient(
    productId: string,
    input: AddRecipeIngredientInput,
  ): Promise<RestResponse<ProductRecipeDetails>>
  updateRecipeIngredient(
    productId: string,
    lineId: string,
    input: UpdateRecipeIngredientInput,
  ): Promise<RestResponse<ProductRecipeDetails>>
  removeRecipeIngredient(productId: string, lineId: string): Promise<RestResponse<void>>
  previewProduction(
    productId: string,
    input: ProductionRequest,
  ): Promise<RestResponse<ProductionPreview>>
  registerProduction(
    productId: string,
    input: ProductionRequest,
  ): Promise<RestResponse<Production>>
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
