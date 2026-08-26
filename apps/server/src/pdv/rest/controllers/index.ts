export * from '@/pdv/rest/controllers/create-sales-channel.controller'
export * from '@/pdv/rest/controllers/list-sales-channels.controller'
export * from '@/pdv/rest/controllers/list-active-sales-channels.controller'
export * from '@/pdv/rest/controllers/update-sales-channel.controller'
export * from '@/pdv/rest/controllers/inactivate-sales-channel.controller'
export * from '@/pdv/rest/controllers/reactivate-sales-channel.controller'
export * from '@/pdv/rest/controllers/delete-sales-channel.controller'
export * from '@/pdv/rest/controllers/list-combos.controller'
export * from '@/pdv/rest/controllers/list-combo-products.controller'
export * from '@/pdv/rest/controllers/get-combo.controller'
export * from '@/pdv/rest/controllers/create-combo.controller'
export * from '@/pdv/rest/controllers/update-combo.controller'
export * from '@/pdv/rest/controllers/inactivate-combo.controller'
export * from '@/pdv/rest/controllers/reactivate-combo.controller'
export * from '@/pdv/rest/controllers/delete-combo.controller'

import { CreateComboController } from '@/pdv/rest/controllers/create-combo.controller'
import { DeleteComboController } from '@/pdv/rest/controllers/delete-combo.controller'
import { GetComboController } from '@/pdv/rest/controllers/get-combo.controller'
import { InactivateComboController } from '@/pdv/rest/controllers/inactivate-combo.controller'
import { ListComboProductsController } from '@/pdv/rest/controllers/list-combo-products.controller'
import { ListCombosController } from '@/pdv/rest/controllers/list-combos.controller'
import { ReactivateComboController } from '@/pdv/rest/controllers/reactivate-combo.controller'
import { UpdateComboController } from '@/pdv/rest/controllers/update-combo.controller'

export const DiscountControllers = [
  ListComboProductsController,
  ListCombosController,
  GetComboController,
  CreateComboController,
  UpdateComboController,
  InactivateComboController,
  ReactivateComboController,
  DeleteComboController,
]

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
