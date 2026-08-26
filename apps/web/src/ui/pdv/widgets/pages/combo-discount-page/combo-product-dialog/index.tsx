import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import { CATEGORY_ICONS } from '@/constants/product-category-icons'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'

import {
  useComboProductDialog,
  type ComboProductDialogProps,
} from './use-combo-product-dialog'

export type { ComboProductDetails } from './use-combo-product-dialog'
export type { ComboProductDialogProps }

export const ComboProductDialog = (props: ComboProductDialogProps) => {
  const {
    accompanimentIds,
    catalogError,
    configurationError,
    handleAdd,
    handleDecreaseQuantity,
    handleFilterChange,
    handleIncreaseQuantity,
    handleOpenChange,
    handleSearchChange,
    handleSelectBrand,
    handleSelectProduct,
    handleSelectSize,
    isCatalogError,
    isLoadingCatalog,
    isValidConfiguration,
    kind,
    products,
    quantity,
    search,
    selectedBrand,
    selectedProduct,
    selectedSize,
    subtotal,
    toggleAccompaniment,
  } = useComboProductDialog(props)
  const formatCurrency = useFormatCurrency()

  return (
    <Dialog onOpenChange={handleOpenChange} open={props.open}>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[900px]'>
        <DialogHeader className='flex flex-col gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-11 place-items-center rounded-xl bg-primary-soft text-primary'>
            <Icon name='package' className='size-5' />
          </span>
          <DialogTitle className='col-auto text-xl'>Adicionar produto</DialogTitle>
          <DialogDescription className='col-auto'>
            Escolha o produto e configure a composição do Combo.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(300px,1.2fr)]'>
          <section aria-label='Produtos disponíveis' className='min-w-0 space-y-3'>
            <div className='flex gap-2'>
              {(['all', 'portion', 'resale'] as const).map((filter) => {
                const filterKind = filter === 'all' ? undefined : filter
                return (
                  <Button
                    aria-pressed={kind === filterKind}
                    key={filter}
                    onClick={() => handleFilterChange(filterKind)}
                    size='sm'
                    type='button'
                    variant={kind === filterKind ? 'default' : 'outline'}
                  >
                    {filter === 'all'
                      ? 'Todos'
                      : filter === 'portion'
                        ? 'Porções'
                        : 'Revendas'}
                  </Button>
                )
              })}
            </div>
            <label
              className='flex items-center gap-2 rounded-lg border bg-card px-3'
              htmlFor='combo-product-search'
            >
              <Icon name='search' className='size-4 text-muted-foreground' />
              <Input
                aria-label='Buscar produtos'
                className='h-10 border-0 px-0 shadow-none focus-visible:ring-0'
                id='combo-product-search'
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder='Buscar produto…'
                value={search}
              />
            </label>
            <div className='max-h-[360px] space-y-2 overflow-y-auto pr-1'>
              {isLoadingCatalog ? (
                <p className='p-4 text-sm text-muted-foreground'>Carregando produtos…</p>
              ) : null}
              {isCatalogError ? (
                <p className='p-4 text-sm text-destructive' role='alert'>
                  {catalogError instanceof Error
                    ? catalogError.message
                    : 'Não foi possível carregar os produtos.'}
                </p>
              ) : null}
              {!isLoadingCatalog && !isCatalogError && products.length === 0 ? (
                <p className='p-4 text-sm text-muted-foreground'>
                  Nenhum produto disponível.
                </p>
              ) : null}
              {products.map((product) => (
                <button
                  aria-pressed={selectedProduct?.productId === product.productId}
                  className='flex min-h-14 w-full items-center gap-3 rounded-xl border border-border-soft p-3 text-left transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary-soft focus-visible:ring-2 focus-visible:ring-ring/40'
                  key={product.productId}
                  onClick={() => handleSelectProduct(product)}
                  type='button'
                >
                  <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary'>
                    <Icon name={CATEGORY_ICONS[product.kind]} className='size-4' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-extrabold'>
                      {product.name}
                    </span>
                    <span className='block text-xs text-muted-foreground'>
                      {product.kind === 'portion' ? 'Porção' : 'Revenda'}
                    </span>
                  </span>
                  <Icon name='arrow' className='size-4 text-muted-foreground' />
                </button>
              ))}
            </div>
          </section>

          <section
            aria-label='Configuração do produto'
            className='min-w-0 rounded-xl border border-border-soft bg-muted/30 p-4 sm:p-5'
          >
            {!selectedProduct ? (
              <div className='grid min-h-[260px] place-items-center text-center text-sm text-muted-foreground'>
                <div>
                  <Icon name='package' className='mx-auto mb-3 size-8 text-primary' />
                  <p>Selecione um produto para configurar.</p>
                </div>
              </div>
            ) : (
              <div className='space-y-5'>
                <div>
                  <Badge variant='secondary'>
                    {selectedProduct.kind === 'portion' ? 'Porção' : 'Revenda'}
                  </Badge>
                  <h3 className='mt-2 text-lg font-extrabold'>{selectedProduct.name}</h3>
                </div>
                {selectedProduct.kind === 'portion' ? (
                  <div className='space-y-4'>
                    <fieldset className='space-y-2'>
                      <legend className='text-sm font-extrabold'>Tamanho</legend>
                      <div className='grid gap-2 sm:grid-cols-2'>
                        {selectedProduct.sizes
                          .filter((size) => size.isActive)
                          .map((size) => (
                            <button
                              aria-pressed={selectedSize?.sizeId === size.sizeId}
                              className='rounded-lg border p-3 text-left text-sm hover:bg-background aria-pressed:border-primary aria-pressed:bg-primary-soft focus-visible:ring-2 focus-visible:ring-ring/40'
                              key={size.sizeId}
                              onClick={() => handleSelectSize(size.sizeId)}
                              type='button'
                            >
                              <span className='block font-bold'>{size.name}</span>
                              <span className='text-muted-foreground'>
                                {formatCurrency(size.basePrice)}
                              </span>
                            </button>
                          ))}
                      </div>
                    </fieldset>
                    {selectedSize?.accompaniments.some((item) => item.isActive) ? (
                      <fieldset className='space-y-2'>
                        <legend className='text-sm font-extrabold'>
                          Acompanhamentos
                        </legend>
                        <div className='grid gap-2'>
                          {selectedSize.accompaniments
                            .filter((item) => item.isActive)
                            .map((item) => (
                              <label
                                className='flex items-center gap-3 rounded-lg border bg-background p-3 text-sm'
                                htmlFor={`combo-accompaniment-${item.accompanimentId}`}
                                key={item.accompanimentId}
                              >
                                <Checkbox
                                  checked={accompanimentIds.includes(
                                    item.accompanimentId,
                                  )}
                                  onCheckedChange={() =>
                                    toggleAccompaniment(item.accompanimentId)
                                  }
                                  id={`combo-accompaniment-${item.accompanimentId}`}
                                />
                                <span className='flex-1'>{item.name}</span>
                                <span className='text-muted-foreground'>
                                  {formatCurrency(item.basePrice)}
                                </span>
                              </label>
                            ))}
                        </div>
                      </fieldset>
                    ) : null}
                  </div>
                ) : (
                  <fieldset className='space-y-2'>
                    <legend className='text-sm font-extrabold'>Marca</legend>
                    <div className='grid gap-2'>
                      {selectedProduct.resaleBrands
                        .filter((brand) => brand.isActive)
                        .map((brand) => (
                          <label
                            className='flex items-center gap-3 rounded-lg border bg-background p-3 text-left text-sm hover:bg-muted data-[selected=true]:border-primary data-[selected=true]:bg-primary-soft'
                            data-selected={selectedBrand?.brandId === brand.brandId}
                            htmlFor={`combo-brand-${brand.brandId}`}
                            key={brand.brandId}
                          >
                            <Checkbox
                              checked={selectedBrand?.brandId === brand.brandId}
                              id={`combo-brand-${brand.brandId}`}
                              onCheckedChange={() => handleSelectBrand(brand.brandId)}
                            />
                            <span className='flex-1 font-bold'>{brand.name}</span>
                            <span className='text-muted-foreground'>
                              {formatCurrency(brand.basePrice)}
                            </span>
                          </label>
                        ))}
                    </div>
                    {selectedProduct.resalePrice !== undefined ? (
                      <p className='text-xs text-muted-foreground'>
                        Sem marca: {formatCurrency(selectedProduct.resalePrice)}
                      </p>
                    ) : null}
                  </fieldset>
                )}
                <div className='flex items-center justify-between rounded-lg border bg-background p-3'>
                  <span className='text-sm font-extrabold'>Quantidade</span>
                  <div className='flex items-center gap-2'>
                    <Button
                      aria-label='Diminuir quantidade'
                      onClick={handleDecreaseQuantity}
                      size='icon-sm'
                      type='button'
                      variant='outline'
                    >
                      −
                    </Button>
                    <output
                      aria-label='Quantidade selecionada'
                      className='w-8 text-center font-extrabold'
                    >
                      {quantity}
                    </output>
                    <Button
                      aria-label='Aumentar quantidade'
                      onClick={handleIncreaseQuantity}
                      size='icon-sm'
                      type='button'
                      variant='outline'
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className='flex items-center justify-between border-t border-border-soft pt-4'>
                  <span className='text-sm text-muted-foreground'>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                {configurationError ? (
                  <p className='text-sm font-semibold text-destructive' role='alert'>
                    {configurationError}
                  </p>
                ) : null}
              </div>
            )}
          </section>
        </div>
        <DialogFooter className='border-t border-border-soft bg-muted/30 p-5 sm:p-6'>
          <Button onClick={() => handleOpenChange(false)} type='button' variant='outline'>
            Cancelar
          </Button>
          <Button disabled={!isValidConfiguration} onClick={handleAdd} type='button'>
            <Icon name='plus' />
            Adicionar produto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
