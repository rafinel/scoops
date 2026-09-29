import type { RecipeIngredientDetails } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { TableCell, TableRow } from '@/ui/shadcn/table'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type RecipeIngredientRowProps = {
  canManage: boolean
  formatCurrency: (value: number) => string
  formatDecimal: (value: number) => string
  formatQuantity: (value: number, unit: string) => string
  ingredient: RecipeIngredientDetails
  onEdit: (ingredient: RecipeIngredientDetails) => void
  onRemove: (ingredient: RecipeIngredientDetails) => void
}

export const RecipeIngredientRow = ({
  canManage,
  formatCurrency,
  formatDecimal,
  formatQuantity,
  ingredient,
  onEdit,
  onRemove,
}: RecipeIngredientRowProps) => (
  <TableRow
    className={
      ingredient.isLimiting
        ? 'border-b border-border-soft bg-destructive/5'
        : 'border-b border-border-soft'
    }
  >
    <TableCell className='p-3 font-bold'>{ingredient.ingredientProductName}</TableCell>
    <TableCell>{ingredient.ingredientBrandName ?? 'Estoque único'}</TableCell>
    <TableCell>{formatQuantity(ingredient.quantity, ingredient.unit)}</TableCell>
    <TableCell>{formatCurrency(ingredient.lineCost)}</TableCell>
    <TableCell>{formatDecimal(ingredient.cogsPercentage)}%</TableCell>
    <TableCell className={ingredient.isLimiting ? 'font-bold text-destructive' : ''}>
      {formatQuantity(ingredient.currentBalance, ingredient.unit)}
      {ingredient.isLimiting ? ' · limitante' : ''}
    </TableCell>
    {canManage ? (
      <TableCell className='p-3'>
        <div className='flex gap-2'>
          <Button
            aria-label={`Editar ${ingredient.ingredientProductName}`}
            onClick={() => onEdit(ingredient)}
            size='sm'
            variant='outline'
          >
            <Icon name='pencil' />
          </Button>
          <Button
            aria-label={`Remover ${ingredient.ingredientProductName}`}
            className='text-destructive'
            onClick={() => onRemove(ingredient)}
            size='sm'
            variant='outline'
          >
            <Icon name='trash-2' />
          </Button>
        </div>
      </TableCell>
    ) : null}
  </TableRow>
)
