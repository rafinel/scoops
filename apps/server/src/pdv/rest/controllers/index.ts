export * from '@/pdv/rest/controllers/create-sales-channel.controller'
export * from '@/pdv/rest/controllers/list-sales-channels.controller'
export * from '@/pdv/rest/controllers/list-active-sales-channels.controller'
export * from '@/pdv/rest/controllers/update-sales-channel.controller'
export * from '@/pdv/rest/controllers/inactivate-sales-channel.controller'
export * from '@/pdv/rest/controllers/reactivate-sales-channel.controller'
export * from '@/pdv/rest/controllers/delete-sales-channel.controller'

import { CreateSalesChannelController } from '@/pdv/rest/controllers/create-sales-channel.controller'
import { DeleteSalesChannelController } from '@/pdv/rest/controllers/delete-sales-channel.controller'
import { InactivateSalesChannelController } from '@/pdv/rest/controllers/inactivate-sales-channel.controller'
import { ListActiveSalesChannelsController } from '@/pdv/rest/controllers/list-active-sales-channels.controller'
import { ListSalesChannelsController } from '@/pdv/rest/controllers/list-sales-channels.controller'
import { ReactivateSalesChannelController } from '@/pdv/rest/controllers/reactivate-sales-channel.controller'
import { UpdateSalesChannelController } from '@/pdv/rest/controllers/update-sales-channel.controller'

export const SalesChannelControllers = [
  CreateSalesChannelController,
  ListSalesChannelsController,
  ListActiveSalesChannelsController,
  UpdateSalesChannelController,
  InactivateSalesChannelController,
  ReactivateSalesChannelController,
  DeleteSalesChannelController,
]
