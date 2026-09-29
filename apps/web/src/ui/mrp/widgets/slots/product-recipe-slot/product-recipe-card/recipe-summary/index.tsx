import type { RecipeIngredientDetails } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { RecipeEmptyState } from '../../recipe-empty-state'
import { RecipeIngredientsTable } from '../../recipe-ingredients-table'
import { Metric } from '../metric'

export type RecipeSummaryProps = {
  limitingIngredientName?: string
  maximumProducible: string
  totalCost: string
  totalCostDetail: string
  unitCost: string
  unitCostDetail: string
  canManage: boolean
  ingredients: readonly RecipeIngredientDetails[]
  onAdd: () => void
  onEdit: (ingredient: RecipeIngredientDetails) => void
  onRemove: (ingredient: RecipeIngredientDetails) => void
}

export const RecipeSummary = ({
  limitingIngredientName,
  maximumProducible,
  totalCost,
  totalCostDetail,
  unitCost,
  unitCostDetail,
  canManage,
  ingredients,
  onAdd,
  onEdit,
  onRemove,
}: RecipeSummaryProps) => (
  <>
    <div className='mt-5 grid gap-3 md:grid-cols-3'>
      <Metric label='CMV total' value={totalCost} detail={totalCostDetail} />
      <Metric label='Custo unitário' value={unitCost} detail={unitCostDetail} />
      <Metric
        attention
        label='Máximo produzível'
        value={maximumProducible}
        detail={
          limitingIngredientName
            ? `limitado por ${limitingIngredientName}`
            : 'Sem ingredientes'
        }
      />
    </div>
    {ingredients.length > 0 ? (
      <>
        <div className='mt-5'>
          <RecipeIngredientsTable
            canManage={canManage}
            ingredients={ingredients}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        </div>
        {canManage ? (
          <Button className='mt-5' onClick={onAdd}>
            <Icon name='plus' /> Adicionar ingrediente
          </Button>
        ) : null}
      </>
    ) : (
      <div className='mt-5'>
        <RecipeEmptyState canAdd={canManage} onAdd={onAdd} />
      </div>
    )}
  </>
)

export const RecipeNotConfigured = ({
  canManage,
  onAdd,
}: {
  canManage: boolean
  onAdd: () => void
}) =>
  canManage ? (
    <div className='mt-5'>
      <RecipeEmptyState canAdd={false} onAdd={onAdd} />
    </div>
  ) : (
    <p className='mt-5 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground'>
      Nenhum ingrediente cadastrado para esta receita.
    </p>
  )
