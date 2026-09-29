import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'

export type RecipeYieldEditorProps = {
  error?: string
  isPending: boolean
  onSave: () => void
  onValueChange: (value: string) => void
  unit: string
  value: string
}

export const RecipeYieldEditor = ({
  error,
  isPending,
  onSave,
  onValueChange,
  unit,
  value,
}: RecipeYieldEditorProps) => (
  <>
    <div className='mt-5 flex max-w-xl flex-col gap-2 rounded-xl bg-muted p-2 focus-within:ring-2 focus-within:ring-ring/20 sm:flex-row sm:items-center sm:gap-0 sm:overflow-hidden sm:p-1'>
      <label
        className='grid min-w-0 flex-1 gap-2 px-3 text-sm font-semibold text-muted-foreground sm:grid-cols-[auto_1fr] sm:items-center sm:gap-3 sm:whitespace-nowrap'
        htmlFor='recipe-yield-quantity'
      >
        Rendimento estimado por:
        <Input
          aria-describedby={error ? 'recipe-yield-error' : undefined}
          aria-invalid={Boolean(error)}
          className='h-9 min-w-0 bg-card'
          id='recipe-yield-quantity'
          inputMode='decimal'
          min='0'
          onChange={(event) => onValueChange(event.currentTarget.value)}
          type='number'
          value={value}
        />
      </label>
      <span className='grid place-items-center rounded-lg bg-card px-3 py-2 text-sm font-bold sm:rounded-none sm:border-l sm:bg-transparent sm:py-0'>
        {unit}
      </span>
      <Button
        className='w-full sm:ml-1 sm:w-auto'
        disabled={isPending}
        onClick={onSave}
        size='sm'
        type='button'
        variant='outline'
      >
        {isPending ? 'Salvando…' : 'Salvar'}
      </Button>
    </div>
    {error ? (
      <p
        className='mt-2 text-sm font-semibold text-destructive'
        id='recipe-yield-error'
        role='alert'
      >
        {error}
      </p>
    ) : null}
  </>
)
