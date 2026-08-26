import type { RecipeIngredientDetails } from '@scoops/core/mrp/domain/structures'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useRemoveRecipeIngredientDialog } from './use-remove-recipe-ingredient-dialog'
export type RemoveRecipeIngredientDialogProps = {
  ingredient: RecipeIngredientDetails
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  productId: string
}
export const RemoveRecipeIngredientDialog = ({
  ingredient,
  onOpenChange,
  onSuccess,
  open,
  productId,
}: RemoveRecipeIngredientDialogProps) => {
  const { error, handleRemove, isPending } = useRemoveRecipeIngredientDialog(productId)
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='overflow-visible'>
        <AlertDialogHeader className='gap-2 border-b border-border-soft p-6 pr-14 sm:grid-cols-[auto_1fr] sm:items-start'>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <Icon name='trash-2' />
          </AlertDialogMedia>
          <AlertDialogTitle>Remover ingrediente?</AlertDialogTitle>
          <AlertDialogDescription>
            {ingredient.ingredientProductName}
            {ingredient.ingredientBrandName ? ` (${ingredient.ingredientBrandName})` : ''}{' '}
            será removido da receita. CMV e máximo produzível serão recalculados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className='px-6 pt-4 text-sm font-semibold text-destructive' role='alert'>
            {error}
          </p>
        ) : null}
        <AlertDialogFooter className='gap-3 sm:flex-nowrap'>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button
            disabled={isPending}
            onClick={() => void handleRemove(ingredient.id, onSuccess)}
            variant='destructive'
          >
            <Icon name='trash-2' /> {isPending ? 'Removendo…' : 'Remover ingrediente'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
