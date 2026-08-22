import type { RecipeIngredientDetails } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import {
  useFormatCurrency,
  useFormatDecimal,
  useFormatQuantity,
} from '@/ui/shared/hooks/use-formatters'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type RecipeIngredientsTableProps = {
  ingredients: readonly RecipeIngredientDetails[]
  onEdit: (ingredient: RecipeIngredientDetails) => void
  onRemove: (ingredient: RecipeIngredientDetails) => void
}

export const RecipeIngredientsTable = ({
  ingredients,
  onEdit,
  onRemove,
}: RecipeIngredientsTableProps) => {
  const formatCurrency = useFormatCurrency()
  const formatDecimal = useFormatDecimal()
  const formatQuantity = useFormatQuantity()

  return (
    <div className='overflow-hidden rounded-xl border'>
      <Table className='min-w-[720px] text-left'>
        <TableCaption className='sr-only'>Ingredientes da receita</TableCaption>
        <TableHeader className='bg-muted text-xs font-semibold tracking-wide text-muted-foreground [&_tr]:border-0'>
          <TableRow className='border-0 hover:bg-transparent'>
            <TableHead className='p-3 text-xs font-semibold text-muted-foreground'>
              INSUMO
            </TableHead>
            <TableHead className='text-xs font-semibold text-muted-foreground'>
              FONTE
            </TableHead>
            <TableHead className='text-xs font-semibold text-muted-foreground'>
              QUANTIDADE
            </TableHead>
            <TableHead className='text-xs font-semibold text-muted-foreground'>
              CUSTO
            </TableHead>
            <TableHead className='text-xs font-semibold text-muted-foreground'>
              % DO CMV
            </TableHead>
            <TableHead className='text-xs font-semibold text-muted-foreground'>
              ESTOQUE
            </TableHead>
            <TableHead className='p-3 text-xs font-semibold text-muted-foreground'>
              AÇÕES
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ingredients.map((ingredient) => (
            <TableRow
              className={
                ingredient.isLimiting
                  ? 'border-b border-border-soft bg-destructive/5'
                  : 'border-b border-border-soft'
              }
              key={ingredient.id}
            >
              <TableCell className='p-3 font-bold'>
                {ingredient.ingredientProductName}
              </TableCell>
              <TableCell>{ingredient.ingredientBrandName ?? 'Estoque único'}</TableCell>
              <TableCell>
                {formatQuantity(ingredient.quantity, ingredient.unit)}
              </TableCell>
              <TableCell>{formatCurrency(ingredient.lineCost)}</TableCell>
              <TableCell>{formatDecimal(ingredient.cogsPercentage)}%</TableCell>
              <TableCell
                className={ingredient.isLimiting ? 'font-bold text-destructive' : ''}
              >
                {formatQuantity(ingredient.currentBalance, ingredient.unit)}
                {ingredient.isLimiting ? ' · limitante' : ''}
              </TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
