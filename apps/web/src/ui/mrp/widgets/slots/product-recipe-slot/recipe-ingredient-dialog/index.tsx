import type { RecipeIngredientDetails } from '@scoops/core/mrp/domain/structures'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import {
  useFormatCurrency,
  useFormatDecimal,
  useFormatQuantity,
} from '@/ui/shared/hooks/use-formatters'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useRecipeIngredientDialog } from './use-recipe-ingredient-dialog'

export type RecipeIngredientDialogProps = {
  existingProductIds: readonly string[]
  ingredient?: RecipeIngredientDetails
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  productId: string
  recipeTotalCost: number
  unit: string
}
export const RecipeIngredientDialog = ({
  existingProductIds,
  ingredient,
  onOpenChange,
  onSuccess,
  open,
  productId,
  recipeTotalCost,
  unit,
}: RecipeIngredientDialogProps) => {
  const formatCurrency = useFormatCurrency()
  const formatDecimal = useFormatDecimal()
  const formatQuantity = useFormatQuantity()
  const form = useRecipeIngredientDialog({
    existingProductIds,
    ingredient,
    open,
    onSuccess,
    productId,
    recipeTotalCost,
  })
  const isEdit = Boolean(ingredient)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary'>
            <Icon name={isEdit ? 'pencil' : 'plus'} />
          </span>
          <div className='min-w-0'>
            <DialogTitle>
              {isEdit ? 'Editar ingrediente' : 'Adicionar ingrediente'}
            </DialogTitle>
            <DialogDescription className='mt-1'>
              {isEdit
                ? 'Trocar o insumo? Remova esta linha e adicione outra.'
                : 'Compõe a receita e afeta CMV, custo unitário e máximo produzível.'}
            </DialogDescription>
          </div>
        </DialogHeader>
        <form className='grid gap-5' onSubmit={form.handleSubmit}>
          <div className='grid gap-5 p-6'>
            {isEdit ? (
              <Label className='grid gap-2 font-bold'>
                Produto
                <Input disabled value={ingredient?.ingredientProductName} />
              </Label>
            ) : (
              <Label className='grid gap-2 font-bold'>
                Produto
                <Select
                  onValueChange={form.handleIngredientProductChange}
                  value={form.ingredientProductId}
                >
                  <SelectTrigger aria-label='Produto' className='w-full'>
                    <SelectValue placeholder='Selecione um ingrediente'>
                      {form.selectedProduct?.product.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {form.candidates.map(({ product, source, unavailableReason }) => (
                      <SelectItem disabled={!source} key={product.id} value={product.id}>
                        {unavailableReason
                          ? `${product.name} — ${unavailableReason}`
                          : product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.candidates.length === 0 ? (
                  <span className='text-sm text-muted-foreground'>
                    Não há ingredientes elegíveis com custo ou fonte atual.
                  </span>
                ) : (
                  <span className='text-sm text-muted-foreground'>
                    Produtos inativos, o próprio produto e itens já adicionados são
                    excluídos. Itens sem custo ou fonte atual ficam indisponíveis.
                  </span>
                )}
              </Label>
            )}
            <Label className='grid gap-2 font-bold'>
              Quantidade
              <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
                <Input
                  {...form.register('quantity', {
                    onChange: form.handleQuantityChange,
                    valueAsNumber: true,
                  })}
                  aria-describedby={
                    form.errors.quantity ? 'recipe-ingredient-quantity-error' : undefined
                  }
                  aria-invalid={Boolean(form.errors.quantity)}
                  className='h-11 border-0 shadow-none focus-visible:ring-0'
                  inputMode='decimal'
                  min='0'
                  type='number'
                />
                <span className='grid min-w-16 place-items-center border-l bg-muted px-3 text-sm font-bold text-muted-foreground'>
                  {ingredient?.unit ?? form.selectedProduct?.product.unit ?? unit}
                </span>
              </div>
            </Label>
            {form.selectedSource || ingredient ? (
              <div className='grid grid-cols-2 gap-3 rounded-xl bg-muted p-4 text-sm sm:grid-cols-4'>
                <p>
                  <span className='block text-xs text-muted-foreground'>FONTE</span>
                  {ingredient?.ingredientBrandName ?? form.selectedSource?.name}
                </p>
                <p>
                  <span className='block text-xs text-muted-foreground'>CUSTO ATUAL</span>
                  {formatCurrency(
                    ingredient?.unitCost ?? form.selectedSource?.unitCost ?? 0,
                  )}
                </p>
                <p>
                  <span className='block text-xs text-muted-foreground'>LINHA / CMV</span>
                  {ingredient
                    ? `${formatCurrency(ingredient.lineCost)} · ${formatDecimal(ingredient.cogsPercentage)}%`
                    : `${formatCurrency(form.previewLineCost)} · ${formatDecimal(form.previewCogsPercentage)}%`}
                </p>
                <p>
                  <span className='block text-xs text-muted-foreground'>ESTOQUE</span>
                  {ingredient
                    ? formatQuantity(ingredient.currentBalance, ingredient.unit)
                    : form.selectedSource
                      ? formatQuantity(
                          form.selectedSource.currentBalance,
                          form.selectedProduct?.product.unit ?? unit,
                        )
                      : null}
                </p>
              </div>
            ) : null}
            {form.errors.quantity ? (
              <p
                className='text-sm font-semibold text-destructive'
                id='recipe-ingredient-quantity-error'
                role='alert'
              >
                Informe uma quantidade maior que zero.
              </p>
            ) : null}
            {form.actionError ? (
              <p className='text-sm font-semibold text-destructive' role='alert'>
                {form.actionError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose
              render={
                <Button disabled={form.isPending} type='button' variant='outline' />
              }
            >
              Cancelar
            </DialogClose>
            <Button
              disabled={
                form.isPending ||
                (!isEdit && (!form.ingredientProductId || !form.selectedSource))
              }
              type='submit'
            >
              {form.isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
