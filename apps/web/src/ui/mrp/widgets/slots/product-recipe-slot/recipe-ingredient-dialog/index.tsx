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
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDecimal } from '@/ui/shared/hooks/use-format-decimal'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
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
  const {
    actionError,
    availableBrands,
    candidates,
    errors,
    handleBrandChange,
    handleIngredientProductChange,
    handleQuantityChange,
    handleSubmit,
    ingredientProductId,
    ingredientBrandId,
    isPending,
    previewCogsPercentage,
    previewLineCost,
    register,
    selectedProduct,
    selectedSource,
  } = useRecipeIngredientDialog({
    existingProductIds,
    ingredient,
    open,
    onSuccess,
    productId,
    recipeTotalCost,
  })
  const isEdit = Boolean(ingredient)
  const displayedUnitCost = selectedSource?.unitCost ?? ingredient?.unitCost ?? 0
  const displayedLineCost = selectedSource
    ? previewLineCost
    : (ingredient?.lineCost ?? previewLineCost)
  const displayedCogsPercentage = selectedSource
    ? previewCogsPercentage
    : (ingredient?.cogsPercentage ?? previewCogsPercentage)
  const displayedCurrentBalance =
    selectedSource?.currentBalance ?? ingredient?.currentBalance
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
        <form className='grid gap-5' onSubmit={handleSubmit}>
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
                  onValueChange={handleIngredientProductChange}
                  value={ingredientProductId}
                >
                  <SelectTrigger aria-label='Produto' className='w-full'>
                    <SelectValue placeholder='Selecione um ingrediente'>
                      {selectedProduct?.product.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map(({ product, source, unavailableReason }) => (
                      <SelectItem disabled={!source} key={product.id} value={product.id}>
                        {unavailableReason
                          ? `${product.name} — ${unavailableReason}`
                          : product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {candidates.length === 0 ? (
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
            {availableBrands.length > 1 ? (
              <Label className='grid gap-2 font-bold'>
                Marca
                <Select value={ingredientBrandId ?? ''} onValueChange={handleBrandChange}>
                  <SelectTrigger aria-label='Marca' className='w-full'>
                    <SelectValue placeholder='Selecione uma marca'>
                      {availableBrands.find(({ brand }) => brand.id === ingredientBrandId)
                        ?.brand.name ?? 'Selecione uma marca'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableBrands.map(({ brand }) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                        {brand.isPrimary ? ' · Principal' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
            ) : null}
            <Label className='grid gap-2 font-bold'>
              Quantidade
              <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
                <Input
                  {...register('quantity', {
                    onChange: handleQuantityChange,
                    valueAsNumber: true,
                  })}
                  aria-describedby={
                    errors.quantity ? 'recipe-ingredient-quantity-error' : undefined
                  }
                  aria-invalid={Boolean(errors.quantity)}
                  className='h-11 border-0 shadow-none focus-visible:ring-0'
                  inputMode='decimal'
                  min='0'
                  type='number'
                />
                <span className='grid min-w-16 place-items-center border-l bg-muted px-3 text-sm font-bold text-muted-foreground'>
                  {ingredient?.unit ?? selectedProduct?.product.unit ?? unit}
                </span>
              </div>
            </Label>
            {selectedSource || ingredient ? (
              <div className='grid grid-cols-2 gap-3 rounded-xl bg-muted p-4 text-sm sm:grid-cols-4'>
                <p>
                  <span className='block text-xs text-muted-foreground'>FONTE</span>
                  {selectedSource?.name ?? ingredient?.ingredientBrandName}
                </p>
                <p>
                  <span className='block text-xs text-muted-foreground'>CUSTO ATUAL</span>
                  {formatCurrency(displayedUnitCost)}
                </p>
                <p>
                  <span className='block text-xs text-muted-foreground'>LINHA / CMV</span>
                  {`${formatCurrency(displayedLineCost)} · ${formatDecimal(displayedCogsPercentage)}%`}
                </p>
                <p>
                  <span className='block text-xs text-muted-foreground'>ESTOQUE</span>
                  {displayedCurrentBalance !== undefined
                    ? formatQuantity(
                        displayedCurrentBalance,
                        ingredient?.unit ?? selectedProduct?.product.unit ?? unit,
                      )
                    : null}
                </p>
              </div>
            ) : null}
            {errors.quantity ? (
              <p
                className='text-sm font-semibold text-destructive'
                id='recipe-ingredient-quantity-error'
                role='alert'
              >
                Informe uma quantidade maior que zero.
              </p>
            ) : null}
            {actionError ? (
              <p className='text-sm font-semibold text-destructive' role='alert'>
                {actionError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button disabled={isPending} type='button' variant='outline' />}
            >
              Cancelar
            </DialogClose>
            <Button
              disabled={
                isPending || (!isEdit && (!ingredientProductId || !selectedSource))
              }
              type='submit'
            >
              {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
