import { UserProfile } from '@scoops/core/identity/domain/structures'

import { Avatar } from '@/ui/shared/widgets/components/avatar'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'

import { IdentityRow } from './identity-row'
import { NameDialog } from './name-dialog'
import { useAccountPage } from './use-account-page'

export const AccountPage = () => {
  const {
    account,
    announcement,
    error,
    feedbackRef,
    handleLogout,
    handleNameDialogOpenChange,
    handleNameSubmit,
    handleOpenNameDialog,
    isLogoutPending,
    isNameDialogOpen,
    isPending,
    logoutError,
    register,
  } = useAccountPage()

  if (!account) return null

  const profileLabel = account.profile === UserProfile.Manager ? 'Gerente' : 'Operador'

  return (
    <section className='w-full space-y-4'>
      <header>
        <h1 className='text-[30px] font-extrabold tracking-tight'>Minha conta</h1>
        <p className='mt-1 text-sm font-medium text-muted-foreground'>
          Consulte seus dados pessoais e controle a sessão deste dispositivo.
        </p>
      </header>
      <div className='grid gap-5 xl:grid-cols-[2.12fr_1fr]'>
        <section className='overflow-hidden rounded-2xl border bg-card shadow-card'>
          <header className='flex flex-col gap-5 border-b border-border-soft p-6 sm:flex-row sm:items-start'>
            <Avatar
              name={account.name}
              className='size-[60px] bg-accent text-primary text-xl'
            />
            <div className='min-w-0 flex-1'>
              <h2 className='truncate text-[22px] font-extrabold tracking-tight'>
                {account.name}
              </h2>
              <p className='truncate text-sm text-muted-foreground'>{account.email}</p>
            </div>
            <div className='flex shrink-0 flex-col items-start gap-2 sm:items-end'>
              <span className='inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-extrabold text-success'>
                <span className='size-1.5 rounded-full bg-success' />
                Conta ativa
              </span>
              <Button
                variant='outline'
                className='h-9 rounded-lg px-3 font-semibold'
                onClick={handleOpenNameDialog}
              >
                <Icon name='pencil' className='size-4' /> Corrigir meu nome
              </Button>
            </div>
          </header>
          <ul className='px-6'>
            <IdentityRow icon='mail' label='E-mail' readOnly value={account.email} />
            <IdentityRow icon='shield' label='Perfil' readOnly value={profileLabel} />
            <IdentityRow
              icon='store'
              label='Sorveteria vinculada'
              value={account.establishmentName}
            />
          </ul>
          <div className='flex items-start gap-2.5 bg-info-soft px-6 py-3 text-xs font-semibold text-info'>
            <Icon name='info' className='mt-0.5 size-4 shrink-0' />
            <p>
              O e-mail e o perfil não podem ser alterados nesta página. Mudanças de senha
              são feitas pelo fluxo de recuperação.
            </p>
          </div>
        </section>
        <section className='self-start overflow-hidden rounded-2xl border bg-card shadow-card xl:h-[268px]'>
          <header className='flex items-start gap-3 border-b border-border-soft p-5'>
            <span className='grid size-9 shrink-0 place-items-center rounded-xl bg-success-soft text-success'>
              <Icon name='monitor' className='size-[18px]' />
            </span>
            <div>
              <h2 className='text-lg font-extrabold'>Sessão deste dispositivo</h2>
              <p className='mt-0.5 text-xs font-extrabold text-success'>Ativa agora</p>
            </div>
          </header>
          <div className='grid gap-4 p-4'>
            <p className='flex items-center gap-2 text-xs font-semibold'>
              <Icon name='monitor' className='size-4 text-muted-foreground' />
              Navegador atual
            </p>
            <p className='flex items-center gap-2 text-xs font-semibold'>
              <Icon name='shield' className='size-4 text-muted-foreground' />
              Somente esta sessão será encerrada
            </p>
          </div>
          <footer className='border-t border-border-soft p-4'>
            <Button
              variant='outline'
              className='h-10 w-full rounded-lg border-danger text-danger hover:bg-danger-soft hover:text-danger'
              disabled={isLogoutPending}
              onClick={() => void handleLogout()}
            >
              <Icon name='door-open' className='size-4' />
              {isLogoutPending ? 'Saindo…' : 'Sair deste dispositivo'}
            </Button>
            <p className='mt-3 text-center text-xs text-muted-foreground'>
              Você será levado para a tela de entrada.
            </p>
            {logoutError ? (
              <p
                className='mt-3 text-center text-xs font-semibold text-destructive'
                role='alert'
              >
                Não foi possível sair agora. Tente novamente.
              </p>
            ) : null}
          </footer>
        </section>
      </div>
      <p className='sr-only' role='status' aria-live='polite'>
        {announcement}
      </p>
      <NameDialog
        error={error}
        feedbackRef={feedbackRef}
        handleNameDialogOpenChange={handleNameDialogOpenChange}
        handleNameSubmit={handleNameSubmit}
        isNameDialogOpen={isNameDialogOpen}
        isPending={isPending}
        register={register}
      />
    </section>
  )
}
