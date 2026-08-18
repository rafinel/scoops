import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

export const productStockControlSchema = z.enum(ProductStockControl)
