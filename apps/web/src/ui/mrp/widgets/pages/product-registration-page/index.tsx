import { Button } from '@/ui/shadcn/button'
import { BackLink } from '@/ui/shared/widgets/components/back-link'

import { ProductRegistrationForm } from './product-registration-form'
import { ProductStockControlCard } from './product-stock-control-card'
import { useProductRegistrationPage } from './use-product-registration-page'

export const ProductRegistrationPage = () => {
  const {
    allowNegativeStock,
    brandErrors,
    brands,
    calculatedInitialStock,
    categories,
    currentUnitCost,
    fieldErrors,
    formError,
    idealStock,
    initialStock,
    isPending,
    name,
    register,
    stockControl,
    unit,
    handleAddBrand,
    handleAllowNegativeStockChange,
    handleBrandChange,
    handleCancel,
    handleCurrentUnitCostChange,
    handleIdealStockChange,
    handleInitialStockChange,
    handleNameChange,
    handlePrimaryBrandChange,
    handleProductCategoryToggle,
    handleRegister,
    handleRemoveBrand,
    handleStockControlChange,
    handleUnitChange,
    isCategoryDisabled,
  } = useProductRegistrationPage()

  return (
    <section className='min-w-0 max-w-full space-y-3 overflow-hidden pb-8'>
      <BackLink aria-label='Voltar para produtos' />
      <div>
        <h1 className='text-2xl font-black tracking-tight sm:text-3xl'>Novo produto</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Catálogo e estoque em uma única página.
        </p>
      </div>
      <ProductRegistrationForm
        categories={categories}
        fieldErrors={fieldErrors}
        isCategoryDisabled={isCategoryDisabled}
        name={name}
        onCategoryToggle={handleProductCategoryToggle}
        onNameChange={handleNameChange}
        onSubmit={handleRegister}
        onUnitChange={handleUnitChange}
        register={register}
        unit={unit}
      >
        <ProductStockControlCard
          allowNegativeStock={allowNegativeStock}
          brandErrors={brandErrors}
          brands={brands}
          calculatedInitialStock={calculatedInitialStock}
          categories={categories}
          currentUnitCost={currentUnitCost}
          fieldErrors={fieldErrors}
          idealStock={idealStock}
          initialStock={initialStock}
          onAddBrand={handleAddBrand}
          onAllowNegativeStockChange={handleAllowNegativeStockChange}
          onBrandChange={handleBrandChange}
          onCurrentUnitCostChange={handleCurrentUnitCostChange}
          onIdealStockChange={handleIdealStockChange}
          onInitialStockChange={handleInitialStockChange}
          onPrimaryBrandChange={handlePrimaryBrandChange}
          onRemoveBrand={handleRemoveBrand}
          onStockControlChange={handleStockControlChange}
          register={register}
          stockControl={stockControl}
        />
        {formError ? (
          <p className='text-sm font-semibold text-destructive' role='alert'>
            {formError}
          </p>
        ) : null}
        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            disabled={isPending}
            onClick={handleCancel}
            type='button'
            variant='outline'
          >
            Cancelar
          </Button>
          <Button disabled={isPending} type='submit'>
            {isPending ? 'Criando…' : 'Criar produto'}
          </Button>
        </div>
      </ProductRegistrationForm>
    </section>
  )
}
