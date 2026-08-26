import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type {
  SalesChannelCreate,
  SalesChannelUpdate,
} from '@scoops/core/pdv/domain/structures'
import type { PdvService as PdvRestService } from '@scoops/core/pdv/interfaces'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'
import type { RestClient } from '@scoops/core/shared/interfaces'

type SalesChannelJson = Omit<SalesChannel, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

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

export const PdvService = (restClient: RestClient): PdvRestService => ({
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
