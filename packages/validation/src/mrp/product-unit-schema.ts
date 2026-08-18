import { ProductUnit } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

export const productUnitSchema = z.enum(ProductUnit)
