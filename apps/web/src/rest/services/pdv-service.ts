import type { Combo, SalesChannel } from '@scoops/core/pdv/domain/entities'
import type {
  ComboDetails,
  ComboListParams,
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

export const PdvService = (restClient: RestClient): PdvRestService => ({
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
