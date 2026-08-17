import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

import { useShopSettingsPage } from './use-shop-settings-page'

export const ShopSettingsPage = () => {
  const {
    announcement,
    error,
    feedbackRef,
    handleNameChange,
    handleNameDialogOpenChange,
    handleNameSubmit,
    handleOpenNameDialog,
    isLoading,
    isNameDialogOpen,
    isPending,
    name,
    queryError,
    refetch,
    settings,
  } = useShopSettingsPage()

  if (isLoading)
    return (
      <section className='grid min-h-40 place-items-center rounded-2xl border bg-card p-6 shadow-card'>
        <p className='text-sm font-semibold text-muted-foreground'>
          Carregando configurações…
        </p>
      </section>
    )

  if (queryError || !settings)
    return (
      <section
        className='rounded-2xl border border-danger/30 bg-danger-soft p-6 text-sm font-semibold text-danger'
        role='alert'
      >
        <p>Não foi possível carregar as configurações da loja. Tente novamente.</p>
        <Button
          className='mt-4 rounded-lg font-bold'
          variant='outline'
          onClick={() => void refetch()}
        >
          Tentar novamente
        </Button>
      </section>
    )

  const statusLabel = settings.establishment.status === 'active' ? 'Ativa' : 'Pendente'
  const createdAtLabel = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  }).format(settings.establishment.createdAt)

  return (
    <section className='w-full space-y-4'>
      <header>
        <h1 className='text-[30px] font-extrabold tracking-tight'>Sorveteria</h1>
        <p className='mt-1 text-sm font-medium text-muted-foreground'>
          Consulte a identidade da {settings.establishment.name} e atualize as
          configurações disponíveis.
        </p>
      </header>
      <section className='overflow-hidden rounded-2xl border bg-card shadow-card'>
        <header className='flex flex-col gap-4 border-b border-border-soft px-6 py-5 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h2 className='text-lg font-extrabold'>Dados da sorveteria</h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Gerencie o nome exibido no Scoops.
            </p>
          </div>
          <Button
            variant='outline'
            className='h-9 rounded-lg px-3 font-semibold'
            onClick={handleOpenNameDialog}
          >
            <Icon name='pencil' className='size-4' /> Corrigir nome
          </Button>
        </header>
        <div className='flex flex-col gap-4 border-b border-border-soft p-6 sm:flex-row sm:items-center'>
          <span className='grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
            <Icon name='store' className='size-6' />
          </span>
          <div className='min-w-0 flex-1'>
            <h3 className='truncate text-lg font-extrabold'>
              {settings.establishment.name}
            </h3>
            <p className='mt-0.5 text-xs text-muted-foreground'>
              O nome aparece para todos os usuários vinculados.
            </p>
          </div>
          <span className='inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-extrabold text-success'>
            <span className='size-1.5 rounded-full bg-success' />
            {statusLabel}
          </span>
        </div>
        <dl className='grid gap-5 px-6 py-5 sm:grid-cols-2'>
          <div>
            <dt className='flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground'>
              <Icon name='user-round' className='size-3.5' />
              Gerente responsável
            </dt>
            <dd className='mt-1 text-sm font-extrabold'>
              {settings.responsibleManager.name}
            </dd>
          </div>
          <div>
            <dt className='flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground'>
              <Icon name='calendar' className='size-3.5' />
              Cadastrada em
            </dt>
            <dd className='mt-1 text-sm font-extrabold'>{createdAtLabel}</dd>
          </div>
        </dl>
      </section>
      <p className='sr-only' role='status' aria-live='polite'>
        {announcement}
      </p>
      <Dialog open={isNameDialogOpen} onOpenChange={handleNameDialogOpenChange}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader className='flex-row items-start gap-3 p-6 pb-0'>
            <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
              <Icon name='pencil' className='size-5' />
            </span>
            <div className='min-w-0'>
              <DialogTitle>Corrigir nome</DialogTitle>
              <DialogDescription>
                Escolha o nome que identifica seu estabelecimento.
              </DialogDescription>
            </div>
          </DialogHeader>
          <form className='grid gap-4 p-6' onSubmit={handleNameSubmit}>
            <Label className='grid gap-2 text-xs font-extrabold'>
              Nome da loja
              <Input
                aria-invalid={Boolean(error)}
                autoFocus
                className='h-12 rounded-xl px-3 text-sm font-semibold focus-visible:border-primary focus-visible:ring-primary/30'
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
              />
            </Label>
            <div className='flex items-start gap-2.5 rounded-xl bg-info-soft px-3.5 py-3 text-xs font-semibold leading-[1.35] text-info'>
              <Icon name='clock' className='mt-0.5 size-4 shrink-0' />
              <p>Essa alteração será refletida para todos os usuários vinculados.</p>
            </div>
            {error ? (
              <p
                ref={feedbackRef}
                className='text-sm font-semibold text-destructive'
                role='alert'
                tabIndex={-1}
              >
                {error}
              </p>
            ) : null}
            <DialogFooter className='-mx-6 -mb-6 bg-card p-4 sm:flex-row sm:justify-end'>
              <Button
                type='button'
                variant='outline'
                className='h-10 rounded-lg px-5 font-bold'
                onClick={() => handleNameDialogOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                className='h-10 rounded-lg px-5 font-bold shadow-primary'
                disabled={isPending}
              >
                <Icon name='check' className='size-4' />
                {isPending ? 'Salvando…' : 'Salvar alteração'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
