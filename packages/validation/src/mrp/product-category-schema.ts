import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

export const productCategorySchema = z.enum(ProductCategory)
