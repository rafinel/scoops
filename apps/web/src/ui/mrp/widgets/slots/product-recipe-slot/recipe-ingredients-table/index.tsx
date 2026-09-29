import type { RecipeIngredientDetails } from '@scoops/core/mrp/domain/structures'

import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDecimal } from '@/ui/shared/hooks/use-format-decimal'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
import { RecipeIngredientRow } from './recipe-ingredient-row'

export type RecipeIngredientsTableProps = {
  canManage?: boolean
  ingredients: readonly RecipeIngredientDetails[]
  onEdit: (ingredient: RecipeIngredientDetails) => void
  onRemove: (ingredient: RecipeIngredientDetails) => void
}

export const RecipeIngredientsTable = ({
  canManage = true,
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
            {canManage ? (
              <TableHead className='p-3 text-xs font-semibold text-muted-foreground'>
                AÇÕES
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ingredients.map((ingredient) => (
            <RecipeIngredientRow
              canManage={canManage}
              formatCurrency={formatCurrency}
              formatDecimal={formatDecimal}
              formatQuantity={formatQuantity}
              ingredient={ingredient}
              key={ingredient.id}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
