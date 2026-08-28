import type { Combo, SalesChannel } from '@scoops/core/pdv/domain/entities'
import type {
  ComboDetails,
  ComboListParams,
  OrderDetails,
  OrderPreview,
  OrderPreviewInput,
  OrderRegistrationInput,
  OrderRegistrationResult,
  ComboUpdate,
  SalesCatalogListParams,
  SalesCatalogProduct,
  SaleItemKind,
  SalesChannelCreate,
  SalesChannelUpdate,
} from '@scoops/core/pdv/domain/structures'
import type { PdvService as PdvRestService } from '@scoops/core/pdv/interfaces'
import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'
import type { RestClient } from '@scoops/core/shared/interfaces'

type SalesChannelJson = Omit<SalesChannel, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

type ComboJson = Omit<Combo, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

type ComboDetailsJson = Omit<ComboDetails, 'combo'> & {
  combo: ComboJson
}

type ComboPageJson = Omit<PaginationResponse<ComboDetailsJson>, 'items'> & {
  items: readonly ComboDetailsJson[]
}

type SalesCatalogPageJson = Omit<PaginationResponse<SalesCatalogProduct>, 'items'> & {
  items: readonly SalesCatalogProductJson[]
}

type SalesCatalogProductJson = SalesCatalogProduct

type OrderJson = Omit<OrderDetails, 'createdAt'> & {
  createdAt: string
}

type OrderRegistrationResultJson =
  | {
      kind: 'registered'
      order: OrderJson
      replayed: boolean
    }
  | Extract<OrderRegistrationResult, { kind: 'repriced' }>
  | Extract<OrderRegistrationResult, { kind: 'review-required' }>
  | Extract<OrderRegistrationResult, { kind: 'correction-required' }>

function mapSalesChannel(channel: SalesChannelJson): SalesChannel {
  return {
    ...channel,
    createdAt: new Date(channel.createdAt),
    updatedAt: new Date(channel.updatedAt),
  }
}

function mapChannelsResponse(
  response: RestResponse<readonly SalesChannelJson[]>,
): RestResponse<readonly SalesChannel[]> {
  if (!response.isSuccessful) {
    return response as unknown as RestResponse<readonly SalesChannel[]>
  }

  return new RestResponse({
    body: response.body.map(mapSalesChannel),
    statusCode: response.statusCode,
    headers: response.headers,
  })
}

function mapChannelResponse(
  response: RestResponse<SalesChannelJson>,
): RestResponse<SalesChannel> {
  if (!response.isSuccessful) return response as unknown as RestResponse<SalesChannel>

  return new RestResponse({
    body: mapSalesChannel(response.body),
    statusCode: response.statusCode,
    headers: response.headers,
  })
}

function mapCombo(combo: ComboJson): Combo {
  return {
    ...combo,
    createdAt: new Date(combo.createdAt),
    updatedAt: new Date(combo.updatedAt),
  }
}

function mapComboDetails(details: ComboDetailsJson): ComboDetails {
  return { ...details, combo: mapCombo(details.combo) }
}

function mapComboPage(response: ComboPageJson): PaginationResponse<ComboDetails> {
  return new PaginationResponse(
    response.items.map(mapComboDetails),
    response.page,
    response.pageSize,
    response.total,
    response.totalPages,
  )
}

function mapSalesCatalogPage(
  response: SalesCatalogPageJson,
): PaginationResponse<SalesCatalogProduct> {
  return new PaginationResponse(
    response.items,
    response.page,
    response.pageSize,
    response.total,
    response.totalPages,
  )
}

function mapOrder(order: OrderJson): OrderDetails {
  return {
    ...order,
    createdAt: new Date(order.createdAt),
  }
}

function mapOrderRegistrationResult(
  result: OrderRegistrationResultJson,
): OrderRegistrationResult {
  if (result.kind !== 'registered') return result

  return {
    ...result,
    order: mapOrder(result.order),
  }
}

function readResponseBody<ResponseBody>(response: RestResponse<ResponseBody>) {
  try {
    return response.body
  } catch {
    // Axios stores typed 409 response bodies on the RestResponse while also
    // exposing the transport error message. The adapter preserves that body
    // when the result is one of the declared order envelopes.
    return undefined
  }
}

function mapOrderRegistrationResponse(
  response: RestResponse<OrderRegistrationResultJson>,
): RestResponse<OrderRegistrationResult> {
  const body = readResponseBody(response)
  if (!body) {
    const rawBody = (response as unknown as { _body?: OrderRegistrationResultJson })._body
    if (!rawBody || typeof rawBody !== 'object' || !('kind' in rawBody)) {
      return response as unknown as RestResponse<OrderRegistrationResult>
    }

    return new RestResponse({
      body: mapOrderRegistrationResult(rawBody),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  }

  return new RestResponse({
    body: mapOrderRegistrationResult(body),
    statusCode: response.statusCode,
    headers: response.headers,
  })
}

export const PdvService = (restClient: RestClient): PdvRestService => ({
  async listOrderCatalog(input) {
    const params = new URLSearchParams({
      page: String(input.page),
      pageSize: String(input.pageSize),
    })
    if (input.search) params.set('search', input.search)
    if (input.kind) params.set('kind', input.kind)

    const response = await restClient.get<SalesCatalogPageJson>(
      `/orders/catalog?${params.toString()}`,
    )
    if (!response.isSuccessful) {
      return response as unknown as RestResponse<PaginationResponse<SalesCatalogProduct>>
    }

    return new RestResponse({
      body: mapSalesCatalogPage(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  previewOrder(input: OrderPreviewInput) {
    return restClient.post<OrderPreview>('/orders/preview', input)
  },

  async registerOrder(input: OrderRegistrationInput) {
    return mapOrderRegistrationResponse(
      await restClient.post<OrderRegistrationResultJson>('/orders', input),
    )
  },

  async listCombos(input: Omit<ComboListParams, 'establishmentId'>) {
    const params = new URLSearchParams({
      page: String(input.page),
      pageSize: String(input.pageSize),
    })
    if (input.search) params.set('search', input.search)
    if (input.type) params.set('type', input.type)
    if (input.status) params.set('status', input.status)

    const response = await restClient.get<ComboPageJson>(`/discounts?${params}`)
    if (!response.isSuccessful) {
      return response as unknown as RestResponse<PaginationResponse<ComboDetails>>
    }

    return new RestResponse({
      body: mapComboPage(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async getCombo(comboId: string) {
    const response = await restClient.get<ComboDetailsJson>(`/discounts/${comboId}`)
    if (!response.isSuccessful) return response as unknown as RestResponse<ComboDetails>

    return new RestResponse({
      body: mapComboDetails(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async listComboProducts(
    input: Omit<SalesCatalogListParams, 'establishmentId'> & { kind?: SaleItemKind },
  ) {
    const params = new URLSearchParams({
      page: String(input.page),
      pageSize: String(input.pageSize),
    })
    if (input.search) params.set('search', input.search)
    if (input.kind) params.set('kind', input.kind)

    const response = await restClient.get<SalesCatalogPageJson>(
      `/discounts/catalog?${params}`,
    )
    if (!response.isSuccessful) {
      return response as unknown as RestResponse<PaginationResponse<SalesCatalogProduct>>
    }

    return new RestResponse({
      body: mapSalesCatalogPage(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async createCombo(input) {
    const response = await restClient.post<ComboDetailsJson>('/discounts', input)
    if (!response.isSuccessful) return response as unknown as RestResponse<ComboDetails>

    return new RestResponse({
      body: mapComboDetails(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async updateCombo(comboId: string, input: ComboUpdate) {
    const response = await restClient.patch<ComboDetailsJson>(`/discounts/${comboId}`, {
      ...input,
      expectedUpdatedAt: input.expectedUpdatedAt.toISOString(),
    })
    if (!response.isSuccessful) return response as unknown as RestResponse<ComboDetails>

    return new RestResponse({
      body: mapComboDetails(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async inactivateCombo(comboId: string, expectedUpdatedAt: Date) {
    const response = await restClient.patch<ComboDetailsJson>(
      `/discounts/${comboId}/inactivate`,
      { expectedUpdatedAt: expectedUpdatedAt.toISOString() },
    )
    if (!response.isSuccessful) return response as unknown as RestResponse<ComboDetails>

    return new RestResponse({
      body: mapComboDetails(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async reactivateCombo(comboId: string, expectedUpdatedAt: Date) {
    const response = await restClient.patch<ComboDetailsJson>(
      `/discounts/${comboId}/reactivate`,
      { expectedUpdatedAt: expectedUpdatedAt.toISOString() },
    )
    if (!response.isSuccessful) return response as unknown as RestResponse<ComboDetails>

    return new RestResponse({
      body: mapComboDetails(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  removeCombo(comboId: string, expectedUpdatedAt: Date) {
    const params = new URLSearchParams({
      expectedUpdatedAt: expectedUpdatedAt.toISOString(),
    })
    return restClient.delete<void>(`/discounts/${comboId}?${params}`)
  },

  async listSalesChannels() {
    return mapChannelsResponse(
      await restClient.get<readonly SalesChannelJson[]>('/sales-channels'),
    )
  },

  async listActiveSalesChannels() {
    return mapChannelsResponse(
      await restClient.get<readonly SalesChannelJson[]>('/sales-channels/active'),
    )
  },

  async createSalesChannel(input: Omit<SalesChannelCreate, 'establishmentId'>) {
    return mapChannelResponse(
      await restClient.post<SalesChannelJson>('/sales-channels', input),
    )
  },

  async updateSalesChannel(channelId: string, input: SalesChannelUpdate) {
    return mapChannelResponse(
      await restClient.patch<SalesChannelJson>(`/sales-channels/${channelId}`, input),
    )
  },

  async inactivateSalesChannel(channelId: string) {
    return mapChannelResponse(
      await restClient.patch<SalesChannelJson>(`/sales-channels/${channelId}/inactivate`),
    )
  },

  async reactivateSalesChannel(channelId: string) {
    return mapChannelResponse(
      await restClient.patch<SalesChannelJson>(`/sales-channels/${channelId}/reactivate`),
    )
  },

  async removeSalesChannel(channelId: string) {
    return restClient.delete<void>(`/sales-channels/${channelId}`)
  },
})
