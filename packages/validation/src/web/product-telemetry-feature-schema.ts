import { z } from 'zod'

export const productTelemetryFeatureSchema = z.enum([
  'dashboard',
  'products',
  'new_sale',
  'orders',
  'sales_channels',
  'discounts',
  'users',
  'shop_settings',
  'subscription',
  'account',
  'notifications',
])
