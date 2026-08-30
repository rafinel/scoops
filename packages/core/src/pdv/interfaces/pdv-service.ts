import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import type { ComboDetails } from '#pdv/domain/structures/combo-details.ts'
import type { ComboCreate } from '#pdv/domain/structures/combo-create.ts'
import type { ComboListParams } from '#pdv/domain/structures/combo-list-params.ts'
import type { ComboUpdate } from '#pdv/domain/structures/combo-update.ts'
import type { OrderRegistrationInput } from '#pdv/domain/structures/order-registration-input.ts'
import type { OrderRegistrationResult } from '#pdv/domain/structures/order-registration-result.ts'
import type { OrderPreview } from '#pdv/domain/structures/order-preview.ts'
import type { OrderPreviewInput } from '#pdv/domain/structures/order-preview.ts'
import type { Order } from '#pdv/domain/entities/order.ts'
import type { OrderDetails } from '#pdv/domain/structures/order-details.ts'
import type { OrderListParams } from '#pdv/domain/structures/order-list-params.ts'
import type { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import type { SalesCatalogListParams } from '#pdv/domain/structures/sales-catalog-list-params.ts'
import type { SalesChannelCreate } from '#pdv/domain/structures/sales-channel-create.ts'
import type { SalesChannelUpdate } from '#pdv/domain/structures/sales-channel-update.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { RestResponse } from '#shared/responses/rest-response.ts'

export interface PdvService {
  listOrders(
    input: Omit<OrderListParams, 'establishmentId'>,
  ): Promise<RestResponse<PaginationResponse<Order>>>
  getOrder(orderId: string): Promise<RestResponse<OrderDetails>>
  cancelOrder(
    orderId: string,
    input: { readonly reason?: string },
  ): Promise<RestResponse<OrderDetails>>
  listOrderCatalog(
    input: Omit<SalesCatalogListParams, 'establishmentId'> & {
      readonly kind?: SaleItemKind
    },
  ): Promise<RestResponse<PaginationResponse<SalesCatalogProduct>>>
  registerOrder(
    input: OrderRegistrationInput,
  ): Promise<RestResponse<OrderRegistrationResult>>
  previewOrder(input: OrderPreviewInput): Promise<RestResponse<OrderPreview>>
  listCombos(
    input: Omit<ComboListParams, 'establishmentId'>,
  ): Promise<RestResponse<PaginationResponse<ComboDetails>>>
  getCombo(comboId: string): Promise<RestResponse<ComboDetails>>
  listComboProducts(
    input: Omit<SalesCatalogListParams, 'establishmentId'> & {
      readonly kind?: SaleItemKind
    },
  ): Promise<RestResponse<PaginationResponse<SalesCatalogProduct>>>
  createCombo(
    input: Omit<ComboCreate, 'establishmentId'>,
  ): Promise<RestResponse<ComboDetails>>
  updateCombo(comboId: string, input: ComboUpdate): Promise<RestResponse<ComboDetails>>
  inactivateCombo(
    comboId: string,
    expectedUpdatedAt: Date,
  ): Promise<RestResponse<ComboDetails>>
  reactivateCombo(
    comboId: string,
    expectedUpdatedAt: Date,
  ): Promise<RestResponse<ComboDetails>>
  removeCombo(comboId: string, expectedUpdatedAt: Date): Promise<RestResponse<void>>
  listSalesChannels(): Promise<RestResponse<readonly SalesChannel[]>>
  listActiveSalesChannels(): Promise<RestResponse<readonly SalesChannel[]>>
  createSalesChannel(
    input: Omit<SalesChannelCreate, 'establishmentId'>,
  ): Promise<RestResponse<SalesChannel>>
  updateSalesChannel(
    channelId: string,
    input: SalesChannelUpdate,
  ): Promise<RestResponse<SalesChannel>>
  inactivateSalesChannel(channelId: string): Promise<RestResponse<SalesChannel>>
  reactivateSalesChannel(channelId: string): Promise<RestResponse<SalesChannel>>
  removeSalesChannel(channelId: string): Promise<RestResponse<void>>
}
