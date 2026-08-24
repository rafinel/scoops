import type { RecipeIngredient } from '@scoops/core/mrp/domain/entities'
import type {
  RecipeIngredientCreate,
  RecipeIngredientUpdate,
} from '@scoops/core/mrp/domain/structures'
import type { RecipeIngredientsRepository } from '@scoops/core/mrp/interfaces'
import { and, eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleRecipeIngredientMapper } from '../mappers/drizzle-recipe-ingredient-mapper'
import { recipeIngredientModel } from '../models/recipe-ingredient-model'

@Injectable()
export class DrizzleRecipeIngredientsRepository
  extends DrizzleRepository
  implements RecipeIngredientsRepository
{
  async add(input: RecipeIngredientCreate): Promise<RecipeIngredient> {
    const now = new Date()
    const [record] = await this.database
      .insert(recipeIngredientModel)
      .values({
        id: crypto.randomUUID(),
        establishmentId: input.establishmentId,
        recipeId: input.recipeId,
        ingredientProductId: input.ingredientProductId,
        quantity: String(input.quantity),
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return DrizzleRecipeIngredientMapper.toDomain(record)
  }

  async findById(
    establishmentId: string,
    recipeId: string,
    lineId: string,
  ): Promise<RecipeIngredient | undefined> {
    const [record] = await this.database
      .select()
      .from(recipeIngredientModel)
      .where(
        and(
          eq(recipeIngredientModel.establishmentId, establishmentId),
          eq(recipeIngredientModel.recipeId, recipeId),
          eq(recipeIngredientModel.id, lineId),
        ),
      )
      .limit(1)
    return record ? DrizzleRecipeIngredientMapper.toDomain(record) : undefined
  }

  async findByRecipeId(
    establishmentId: string,
    recipeId: string,
  ): Promise<readonly RecipeIngredient[]> {
    const records = await this.database
      .select()
      .from(recipeIngredientModel)
      .where(
        and(
          eq(recipeIngredientModel.establishmentId, establishmentId),
          eq(recipeIngredientModel.recipeId, recipeId),
        ),
      )
    return records.map(DrizzleRecipeIngredientMapper.toDomain)
  }

  async findByRecipeAndProduct(
    establishmentId: string,
    recipeId: string,
    productId: string,
  ): Promise<RecipeIngredient | undefined> {
    const [record] = await this.database
      .select()
      .from(recipeIngredientModel)
      .where(
        and(
          eq(recipeIngredientModel.establishmentId, establishmentId),
          eq(recipeIngredientModel.recipeId, recipeId),
          eq(recipeIngredientModel.ingredientProductId, productId),
        ),
      )
      .limit(1)
    return record ? DrizzleRecipeIngredientMapper.toDomain(record) : undefined
  }

  async replace(
    establishmentId: string,
    recipeId: string,
    lineId: string,
    changes: RecipeIngredientUpdate,
  ): Promise<RecipeIngredient> {
    const [record] = await this.database
      .update(recipeIngredientModel)
      .set({
        quantity: changes.quantity === undefined ? undefined : String(changes.quantity),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(recipeIngredientModel.establishmentId, establishmentId),
          eq(recipeIngredientModel.recipeId, recipeId),
          eq(recipeIngredientModel.id, lineId),
        ),
      )
      .returning()
    return DrizzleRecipeIngredientMapper.toDomain(record)
  }

  async remove(establishmentId: string, recipeId: string, lineId: string): Promise<void> {
    await this.database
      .delete(recipeIngredientModel)
      .where(
        and(
          eq(recipeIngredientModel.establishmentId, establishmentId),
          eq(recipeIngredientModel.recipeId, recipeId),
          eq(recipeIngredientModel.id, lineId),
        ),
      )
  }

  async removeAll(): Promise<void> {
    await this.database.delete(recipeIngredientModel)
  }
}
