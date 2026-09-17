import type { StockAttentionFactsRepository } from '@scoops/core/mrp/interfaces'
import type { StockAttentionSourceFact } from '@scoops/core/mrp/domain/structures'
import { and, asc, eq, exists, gt, inArray } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { productModel } from '../models/product-model'
import { recipeIngredientModel } from '../models/recipe-ingredient-model'
import { recipeModel } from '../models/recipe-model'
import { stockBalanceModel } from '../models/stock-balance-model'
import { DrizzleStockAttentionSourceFactMapper } from '../mappers/drizzle-stock-attention-source-fact-mapper'

@Injectable()
export class DrizzleStockAttentionFactsRepository
  extends DrizzleRepository
  implements StockAttentionFactsRepository
{
  async listBatch(input: {
    establishmentId: string
    cursor?: string
    limit: number
  }): Promise<{ items: readonly StockAttentionSourceFact[]; nextCursor?: string }> {
    const products = await this.database
      .select()
      .from(productModel)
      .where(
        and(
          eq(productModel.establishmentId, input.establishmentId),
          input.cursor ? gt(productModel.id, input.cursor) : undefined,
        ),
      )
      .orderBy(asc(productModel.id))
      .limit(Math.min(input.limit, 500) + 1)
    const hasNext = products.length > Math.min(input.limit, 500)
    const page = hasNext ? products.slice(0, -1) : products
    const balances = page.length
      ? await this.database
          .select()
          .from(stockBalanceModel)
          .where(
            inArray(
              stockBalanceModel.productId,
              page.map((product) => product.id),
            ),
          )
      : []
    const recipes = page.length
      ? await this.database
          .select()
          .from(recipeModel)
          .where(
            and(
              eq(recipeModel.establishmentId, input.establishmentId),
              inArray(
                recipeModel.productId,
                page.map((product) => product.id),
              ),
            ),
          )
      : []
    const recipeIds = recipes.map((recipe) => recipe.id)
    const ingredients = recipeIds.length
      ? await this.database
          .select()
          .from(recipeIngredientModel)
          .where(
            and(
              eq(recipeIngredientModel.establishmentId, input.establishmentId),
              inArray(recipeIngredientModel.recipeId, recipeIds),
            ),
          )
      : []
    const ingredientProductIds = [
      ...new Set(ingredients.map((item) => item.ingredientProductId)),
    ]
    const ingredientBalances = ingredientProductIds.length
      ? await this.database
          .select()
          .from(stockBalanceModel)
          .where(
            and(
              inArray(stockBalanceModel.productId, ingredientProductIds),
              exists(
                this.database
                  .select({ id: productModel.id })
                  .from(productModel)
                  .where(
                    and(
                      eq(productModel.id, stockBalanceModel.productId),
                      eq(productModel.establishmentId, input.establishmentId),
                    ),
                  ),
              ),
            ),
          )
      : []
    const totals = new Map<string, number>()
    for (const balance of balances)
      totals.set(
        balance.productId,
        (totals.get(balance.productId) ?? 0) + Number(balance.quantity),
      )
    const balancesByTarget = new Map<string, number>()
    for (const balance of ingredientBalances) {
      const key = `${balance.productId}:${balance.brandId ?? 'single'}`
      balancesByTarget.set(
        key,
        (balancesByTarget.get(key) ?? 0) + Number(balance.quantity),
      )
    }
    const ingredientsByRecipe = new Map<string, typeof ingredients>()
    for (const ingredient of ingredients) {
      const recipeIngredients = ingredientsByRecipe.get(ingredient.recipeId) ?? []
      recipeIngredients.push(ingredient)
      ingredientsByRecipe.set(ingredient.recipeId, recipeIngredients)
    }
    const recipesByProduct = new Map(recipes.map((recipe) => [recipe.productId, recipe]))
    return {
      items: page.map((product) =>
        DrizzleStockAttentionSourceFactMapper.toDomain({
          establishmentId: product.establishmentId,
          productId: product.id,
          productName: product.name,
          categories: product.categories as StockAttentionSourceFact['categories'],
          availableQuantity: totals.get(product.id) ?? 0,
          idealQuantity: product.idealStock === null ? null : Number(product.idealStock),
          recipe: (() => {
            const recipe = recipesByProduct.get(product.id)
            if (!recipe) return null
            return {
              yieldQuantity: Number(recipe.yieldQuantity),
              ingredients: (ingredientsByRecipe.get(recipe.id) ?? []).map(
                (ingredient) => ({
                  requiredQuantity: Number(ingredient.quantity),
                  availableQuantity:
                    balancesByTarget.get(
                      `${ingredient.ingredientProductId}:${ingredient.ingredientBrandId ?? 'single'}`,
                    ) ?? 0,
                }),
              ),
            }
          })(),
        }),
      ),
      ...(hasNext && page.at(-1) ? { nextCursor: page.at(-1)?.id } : {}),
    }
  }
}
