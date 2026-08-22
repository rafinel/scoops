import type { Recipe } from '@scoops/core/mrp/domain/entities'
import type { RecipeCreate, RecipeUpdate } from '@scoops/core/mrp/domain/structures'
import type { RecipesRepository } from '@scoops/core/mrp/interfaces'
import { and, eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleRecipeMapper } from '../mappers/drizzle-recipe-mapper'
import { recipeModel } from '../models/recipe-model'

@Injectable()
export class DrizzleRecipesRepository
  extends DrizzleRepository
  implements RecipesRepository
{
  async add(input: RecipeCreate): Promise<Recipe> {
    const now = new Date()
    const [record] = await this.database
      .insert(recipeModel)
      .values({
        id: crypto.randomUUID(),
        establishmentId: input.establishmentId,
        productId: input.productId,
        yieldQuantity: String(input.yieldQuantity),
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return DrizzleRecipeMapper.toDomain(record)
  }

  async findById(establishmentId: string, recipeId: string): Promise<Recipe | undefined> {
    const [record] = await this.database
      .select()
      .from(recipeModel)
      .where(
        and(
          eq(recipeModel.establishmentId, establishmentId),
          eq(recipeModel.id, recipeId),
        ),
      )
      .limit(1)
    return record ? DrizzleRecipeMapper.toDomain(record) : undefined
  }

  async findByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<Recipe | undefined> {
    const [record] = await this.database
      .select()
      .from(recipeModel)
      .where(
        and(
          eq(recipeModel.establishmentId, establishmentId),
          eq(recipeModel.productId, productId),
        ),
      )
      .limit(1)
    return record ? DrizzleRecipeMapper.toDomain(record) : undefined
  }

  async replace(
    establishmentId: string,
    recipeId: string,
    changes: RecipeUpdate,
  ): Promise<Recipe> {
    const [record] = await this.database
      .update(recipeModel)
      .set({
        yieldQuantity:
          changes.yieldQuantity === undefined ? undefined : String(changes.yieldQuantity),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(recipeModel.establishmentId, establishmentId),
          eq(recipeModel.id, recipeId),
        ),
      )
      .returning()
    return DrizzleRecipeMapper.toDomain(record)
  }

  async remove(establishmentId: string, recipeId: string): Promise<void> {
    await this.database
      .delete(recipeModel)
      .where(
        and(
          eq(recipeModel.establishmentId, establishmentId),
          eq(recipeModel.id, recipeId),
        ),
      )
  }
}
