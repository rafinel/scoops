import type { RecipeIngredient } from '@scoops/core/mrp/domain/entities'
import type {
  RecipeIngredientCreate,
  RecipeIngredientUpdate,
} from '@scoops/core/mrp/domain/structures'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import type { RecipeIngredientsRepository } from '@scoops/core/mrp/interfaces'
import { and, count, eq } from 'drizzle-orm'
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
        ingredientBrandId: input.ingredientBrandId ?? null,
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

  async findManyByIngredientProductId(
    establishmentId: string,
    ingredientProductId: string,
  ): Promise<readonly RecipeIngredient[]> {
    const records = await this.database
      .select()
      .from(recipeIngredientModel)
      .where(
        and(
          eq(recipeIngredientModel.establishmentId, establishmentId),
          eq(recipeIngredientModel.ingredientProductId, ingredientProductId),
        ),
      )
    return records.map(DrizzleRecipeIngredientMapper.toDomain)
  }

  async countByIngredientProductId(
    establishmentId: string,
    ingredientProductId: string,
  ): Promise<number> {
    const [record] = await this.database
      .select({ count: count() })
      .from(recipeIngredientModel)
      .where(
        and(
          eq(recipeIngredientModel.establishmentId, establishmentId),
          eq(recipeIngredientModel.ingredientProductId, ingredientProductId),
        ),
      )
    return Number(record?.count ?? 0)
  }

  async replaceQuantitiesByIngredientProductId(
    establishmentId: string,
    ingredientProductId: string,
    quantities: readonly { lineId: string; quantity: number }[],
  ): Promise<void> {
    for (const { lineId, quantity } of quantities) {
      const records = await this.database
        .update(recipeIngredientModel)
        .set({ quantity: String(quantity), updatedAt: new Date() })
        .where(
          and(
            eq(recipeIngredientModel.establishmentId, establishmentId),
            eq(recipeIngredientModel.ingredientProductId, ingredientProductId),
            eq(recipeIngredientModel.id, lineId),
          ),
        )
        .returning({ id: recipeIngredientModel.id })
      if (records.length !== 1) throw new ConflictError('Database operation conflicted')
    }
  }

  async removeByIngredientProductId(
    establishmentId: string,
    ingredientProductId: string,
  ): Promise<void> {
    await this.database
      .delete(recipeIngredientModel)
      .where(
        and(
          eq(recipeIngredientModel.establishmentId, establishmentId),
          eq(recipeIngredientModel.ingredientProductId, ingredientProductId),
        ),
      )
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
        ingredientBrandId:
          changes.ingredientBrandId === undefined ? undefined : changes.ingredientBrandId,
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
    const records = await this.database
      .delete(recipeIngredientModel)
      .where(
        and(
          eq(recipeIngredientModel.establishmentId, establishmentId),
          eq(recipeIngredientModel.recipeId, recipeId),
          eq(recipeIngredientModel.id, lineId),
        ),
      )
      .returning({ id: recipeIngredientModel.id })
    if (!records.length) throw new ConflictError('Database operation conflicted')
  }

  async removeAll(): Promise<void> {
    await this.database.delete(recipeIngredientModel)
  }
}
