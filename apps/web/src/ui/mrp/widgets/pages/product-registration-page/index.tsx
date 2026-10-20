import { Button } from '@/ui/shadcn/button'
import { BackLink } from '@/ui/shared/widgets/components/back-link'

import { ProductRegistrationForm } from './product-registration-form'
import { ProductSizeFields } from './product-size-fields'
import { ProductStockControlCard } from './product-stock-control-card'
import { useProductRegistrationPage } from './use-product-registration-page'

export const ProductRegistrationPage = () => {
  const {
    accompanimentPrice,
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
    isAccompanimentPriceVisible,
    isPending,
    isResalePriceVisible,
    isSizesSectionVisible,
    name,
    register,
    resalePrice,
    sizeFields,
    stockControl,
    unit,
    handleAccompanimentPriceChange,
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
    handleResalePriceChange,
    handleStockControlChange,
    handleUnitChange,
    isCategoryDisabled,
  } = useProductRegistrationPage()

  return (
    <section className='min-w-0 max-w-full space-y-3 overflow-hidden pb-8'>
      <BackLink aria-label='Voltar para produtos' />
      <div>
        <h1 className='text-2xl font-black tracking-tight sm:text-3xl'>Novo produto</h1>
      </div>
      <ProductRegistrationForm
        accompanimentPrice={accompanimentPrice}
        categories={categories}
        fieldErrors={fieldErrors}
        isAccompanimentPriceVisible={isAccompanimentPriceVisible}
        isCategoryDisabled={isCategoryDisabled}
        isResalePriceVisible={isResalePriceVisible}
        name={name}
        onAccompanimentPriceChange={handleAccompanimentPriceChange}
        onCategoryToggle={handleProductCategoryToggle}
        onNameChange={handleNameChange}
        onResalePriceChange={handleResalePriceChange}
        onSubmit={handleRegister}
        onUnitChange={handleUnitChange}
        register={register}
        resalePrice={resalePrice}
        unit={unit}
      >
        {isSizesSectionVisible ? <ProductSizeFields {...sizeFields} /> : null}
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
