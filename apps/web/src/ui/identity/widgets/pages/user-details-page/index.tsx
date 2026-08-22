import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { invitationCorrectionFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'

import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/ui/shared/widgets/components/avatar'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Pagination } from '@/ui/shared/widgets/components/pagination'
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
import { ActionDialog, CorrectNameDialog } from './action-dialog'
import {
  actionDescription,
  actionIcon,
  actionLabel,
  dateLabel,
  dateTimeLabel,
  invitationSentLabel,
  profileLabel,
  profileDescription,
  shortDateTimeLabel,
  statusLabel,
} from './formatters'
import { useUserDetailsPage } from './use-user-details-page'

type InvitationCorrectionFormValues = z.infer<typeof invitationCorrectionFormSchema>

export const UserDetailsPage = ({ userId }: { userId: string }) => {
  const {
    correctError,
    correctPending,
    dialog,
    error,
    handleCloseDialog,
    handleConfirmAction,
    handleCorrectInvitation,
    handleCorrectName,
    handleOpenDialog,
    historyPage,
    historyPageSize,
    historyRecords,
    historyTotal,
    isError,
    isLoading,
    isSelf,
    invitationRemainingDays,
    invitationSentAt,
    nameError,
    namePending,
    pending,
    refetch,
    setHistoryPage,
    user,
    userDetails,
  } = useUserDetailsPage({ userId })

  if (isLoading)
    return (
      <div aria-live='polite' className='py-16 text-center text-sm text-muted-foreground'>
        Carregando usuário…
      </div>
    )
  if (isError || !user || !userDetails)
    return (
      <div className='py-16 text-center'>
        <p className='font-bold'>Não foi possível carregar este usuário.</p>
        <Button
          variant='outline'
          className='mt-3 rounded-lg px-4 py-2 font-bold'
          onClick={() => void refetch()}
          type='button'
        >
          Tentar novamente
        </Button>
      </div>
    )
  const { auditRecords } = userDetails
  return (
    <section className='space-y-5'>
      <Link
        className='inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground'
        search={{ search: '', profile: undefined, status: undefined, page: 1 }}
        to={ROUTES.users}
      >
        <Icon name='arrow' className='size-4 rotate-180' />
        Usuários
      </Link>
      <header className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <h1 className='text-[26px] font-extrabold tracking-tight sm:text-[28px]'>
            Detalhe do usuário
          </h1>
          <p className='mt-1 text-sm font-medium text-muted-foreground'>
            Consulte dados, permissões e alterações desta conta.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {user.status === UserStatus.Pending ? (
            <>
              <Button
                variant='outline'
                className='min-h-10 rounded-[10px] border-danger/50 px-3 text-sm font-bold text-danger hover:bg-danger-bg hover:text-danger'
                onClick={() => handleOpenDialog('cancel')}
                type='button'
              >
                Cancelar convite
              </Button>
              <Button
                className='min-h-10 rounded-[10px] px-3 text-sm font-bold shadow-primary'
                onClick={() => handleOpenDialog('resend')}
                type='button'
              >
                Reenviar convite
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='outline'
                className='min-h-10 rounded-[10px] border-danger/50 px-3 text-sm font-bold text-danger hover:bg-danger-bg hover:text-danger'
                disabled={isSelf || user.status === UserStatus.Inactive}
                onClick={() => handleOpenDialog('deactivate')}
                type='button'
              >
                <Icon name='user-round' className='size-4' />
                {user.status === UserStatus.Inactive
                  ? 'Acesso desativado'
                  : 'Desativar acesso'}
              </Button>
              {user.status === UserStatus.Inactive ? (
                <Button
                  className='min-h-10 rounded-[10px] px-3 text-sm font-bold shadow-primary'
                  onClick={() => handleOpenDialog('reactivate')}
                  type='button'
                >
                  <Icon name='user-check' className='size-4' />
                  Reativar acesso
                </Button>
              ) : (
                <Button
                  className='min-h-10 rounded-[10px] px-3 text-sm font-bold shadow-primary'
                  disabled={isSelf}
                  onClick={() =>
                    handleOpenDialog(
                      user.profile === UserProfile.Manager ? 'demote' : 'promote',
                    )
                  }
                  type='button'
                >
                  <Icon name='shield' className='size-4' />
                  {user.profile === UserProfile.Manager
                    ? 'Rebaixar a operador'
                    : 'Promover a gerente'}
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      <section className='rounded-2xl border bg-card p-4 shadow-card sm:p-5'>
        <div className='flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between'>
          <div className='flex min-w-0 items-center gap-3'>
            <Avatar name={user.name} className='size-12 text-base' />
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='truncate text-lg font-extrabold'>{user.name}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${
                    user.status === UserStatus.Active
                      ? 'bg-success-soft text-success'
                      : user.status === UserStatus.Pending
                        ? 'bg-warning-soft text-warning'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className='size-1.5 rounded-full bg-current' />
                  {statusLabel(user.status)}
                </span>
                <Button
                  variant='outline'
                  className='h-8 rounded-lg px-2.5 text-xs font-bold'
                  onClick={() =>
                    handleOpenDialog(
                      user.status === UserStatus.Pending ? 'correctInvitation' : 'name',
                    )
                  }
                  type='button'
                >
                  <Icon name='pencil' className='size-3.5' />
                  Corrigir nome
                </Button>
              </div>
              <p className='mt-1 truncate text-sm text-muted-foreground'>{user.email}</p>
            </div>
          </div>
          <dl className='grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3'>
            <div>
              <dt className='text-xs font-semibold text-muted-foreground'>Perfil</dt>
              <dd className='mt-1 font-extrabold'>{profileLabel(user.profile)}</dd>
            </div>
            {user.status === UserStatus.Pending ? (
              <>
                <div>
                  <dt className='text-xs font-semibold text-muted-foreground'>
                    Convite enviado
                  </dt>
                  <dd className='mt-1 whitespace-nowrap font-extrabold'>
                    {invitationSentAt ? invitationSentLabel(invitationSentAt) : 'Agora'}
                  </dd>
                </div>
                <div>
                  <dt className='text-xs font-semibold text-muted-foreground'>
                    Expira em
                  </dt>
                  <dd className='mt-1 whitespace-nowrap font-extrabold'>
                    {invitationRemainingDays ?? 0} dias
                  </dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt className='text-xs font-semibold text-muted-foreground'>
                    Último acesso
                  </dt>
                  <dd className='mt-1 whitespace-nowrap font-extrabold'>
                    {shortDateTimeLabel(user.lastAccessAt)}
                  </dd>
                </div>
                <div>
                  <dt className='text-xs font-semibold text-muted-foreground'>
                    Na equipe desde
                  </dt>
                  <dd className='mt-1 whitespace-nowrap font-extrabold'>
                    {dateLabel(user.createdAt)}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
        {isSelf ? (
          <p className='mt-4 border-t border-border-soft pt-3 text-xs text-muted-foreground'>
            Você não pode alterar o próprio acesso.
          </p>
        ) : null}
      </section>

      <div className='grid items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.8fr)]'>
        <section className='overflow-hidden rounded-2xl border bg-card shadow-card'>
          <header className='border-b border-border-soft px-5 py-5 sm:px-6'>
            <h2 className='text-base font-extrabold sm:text-lg'>
              Histórico de alterações
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Ações relacionadas à identidade e ao acesso deste usuário.
            </p>
          </header>
          {auditRecords.length === 0 && user.status !== UserStatus.Pending ? (
            <p className='px-5 py-10 text-sm text-muted-foreground sm:px-6'>
              Nenhuma atividade registrada.
            </p>
          ) : (
            <ol>
              {user.status === UserStatus.Pending && historyPage === 1 ? (
                <li className='flex gap-3 border-b border-border-soft px-5 py-4 sm:gap-4 sm:px-6'>
                  <span className='grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-warning'>
                    <Icon name='clock' className='size-4' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
                      <div>
                        <p className='text-sm font-extrabold'>Aguardando confirmação</p>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          O acesso será liberado após {user.name} criar a senha.
                        </p>
                      </div>
                      <div className='shrink-0 text-left text-xs text-muted-foreground sm:text-right'>
                        <p className='font-semibold'>Agora</p>
                        <p className='mt-1'>pelo sistema</p>
                      </div>
                    </div>
                  </div>
                </li>
              ) : null}
              {user.status === UserStatus.Pending &&
              historyPage === 1 &&
              invitationSentAt ? (
                <li className='flex gap-3 border-b border-border-soft px-5 py-4 sm:gap-4 sm:px-6'>
                  <span className='grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-primary'>
                    <Icon name='send' className='size-4' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
                      <div>
                        <p className='text-sm font-extrabold'>Convite enviado</p>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          Link de confirmação enviado por e-mail.
                        </p>
                      </div>
                      <div className='shrink-0 text-left text-xs text-muted-foreground sm:text-right'>
                        <p className='font-semibold'>
                          {invitationSentLabel(invitationSentAt)}
                        </p>
                        <p className='mt-1'>
                          por {auditRecords[0]?.actorName ?? 'pelo sistema'}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ) : null}
              {historyRecords.map((record) => (
                <li
                  className='flex gap-3 border-b border-border-soft px-5 py-4 last:border-b-0 sm:gap-4 sm:px-6'
                  key={record.id}
                >
                  <span className='grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-primary'>
                    <Icon name={actionIcon(record.action)} className='size-4' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
                      <div>
                        <p className='text-sm font-extrabold'>{actionLabel(record)}</p>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {actionDescription(record)}
                        </p>
                      </div>
                      <div className='shrink-0 text-left text-xs text-muted-foreground sm:text-right'>
                        <p className='font-semibold'>
                          {dateTimeLabel(record.occurredAt)}
                        </p>
                        <p className='mt-1'>por {record.actorName}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <Pagination
            currentPage={historyPage}
            onPageChange={setHistoryPage}
            pageSize={historyPageSize}
            totalItems={historyTotal}
          />
        </section>

        <section className='overflow-hidden rounded-2xl border bg-card shadow-card'>
          <header className='flex items-start justify-between gap-3 border-b border-border-soft px-5 py-5 sm:px-6'>
            <div>
              <h2 className='text-base font-extrabold sm:text-lg'>
                Permissões do perfil
              </h2>
              <p className='mt-1 text-sm text-muted-foreground'>
                {profileDescription(user.profile, user.status)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                user.profile === UserProfile.Manager
                  ? 'bg-accent text-primary'
                  : 'bg-info-soft text-info'
              }`}
            >
              {profileLabel(user.profile)}
            </span>
          </header>
          <div className='space-y-5 px-5 py-5 sm:px-6'>
            <div>
              <p className='mb-2 text-xs font-semibold text-muted-foreground'>
                Pode acessar
              </p>
              <ul className='space-y-2.5'>
                {['Nova venda', 'Pedidos'].map((permission) => (
                  <li
                    className='flex items-center gap-3 text-sm font-extrabold'
                    key={permission}
                  >
                    <span className='grid size-6 place-items-center rounded-lg bg-success-soft text-success'>
                      <Icon name='check' className='size-4' />
                    </span>
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
            <div className='border-t border-border-soft pt-4'>
              <p className='mb-2 text-xs font-semibold text-muted-foreground'>
                {user.profile === UserProfile.Manager
                  ? 'Também gerencia'
                  : 'Não gerencia'}
              </p>
              <ul className='space-y-2.5'>
                {[
                  'Usuários',
                  'Configurações da sorveteria',
                  'Produtos',
                  'Canais de venda',
                  'Descontos',
                  'Assinaturas',
                ].map((permission) => {
                  const canAccess = user.profile === UserProfile.Manager
                  return (
                    <li
                      className={`flex items-center gap-3 text-sm font-extrabold ${
                        canAccess ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                      key={permission}
                    >
                      <span
                        className={`grid size-6 place-items-center rounded-lg ${
                          canAccess
                            ? 'bg-accent text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon name={canAccess ? 'check' : 'lock'} className='size-3.5' />
                      </span>
                      {permission}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </section>
      </div>
      <ActionDialog
        danger={dialog === 'deactivate' || dialog === 'cancel'}
        error={error}
        message={
          dialog === 'deactivate'
            ? `Desativar ${user.name}? O acesso será bloqueado.`
            : dialog === 'reactivate'
              ? `Reativar ${user.name}?`
              : dialog === 'promote'
                ? `Promover ${user.name} a gerente?`
                : dialog === 'demote'
                  ? `Tornar ${user.name} operador?`
                  : dialog === 'resend'
                    ? `Reenviar o convite de ${user.name}?`
                    : `Cancelar o convite de ${user.name}?`
        }
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        open={
          dialog === 'deactivate' ||
          dialog === 'reactivate' ||
          dialog === 'promote' ||
          dialog === 'demote' ||
          dialog === 'cancel' ||
          dialog === 'resend'
        }
        pending={pending}
        title={
          dialog === 'promote'
            ? 'Promover usuário?'
            : dialog === 'demote'
              ? 'Rebaixar usuário?'
              : dialog === 'deactivate'
                ? 'Desativar acesso?'
                : dialog === 'reactivate'
                  ? 'Reativar acesso?'
                  : dialog === 'resend'
                    ? 'Reenviar convite?'
                    : 'Cancelar convite?'
        }
        confirmLabel={dialog === 'resend' ? 'Reenviar' : 'Confirmar'}
      />
      <CorrectNameDialog
        error={nameError}
        initialName={user.name}
        onClose={handleCloseDialog}
        onSubmit={handleCorrectName}
        open={dialog === 'name'}
        pending={namePending}
      />
      {dialog === 'correctInvitation' ? (
        <InvitationCorrectionDialog
          email={user.email}
          name={user.name}
          pending={correctPending}
          error={correctError}
          onClose={handleCloseDialog}
          onSubmit={handleCorrectInvitation}
        />
      ) : null}
    </section>
  )
}

function InvitationCorrectionDialog({
  name,
  email,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  name: string
  email: string
  pending: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (input: { name: string; email: string }) => Promise<void>
}) {
  const {
    register,
    reset,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm<InvitationCorrectionFormValues>({
    defaultValues: { email, name },
    resolver: zodResolver(invitationCorrectionFormSchema),
  })

  useEffect(() => {
    reset({ email, name })
  }, [email, name, reset])

  async function handleSubmit(values: InvitationCorrectionFormValues) {
    await onSubmit({ email: values.email.trim(), name: values.name.trim() })
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
            <Icon name='mail-check' className='size-5' />
          </span>
          <div className='min-w-0'>
            <DialogTitle>Corrigir convite</DialogTitle>
            <DialogDescription className='mt-1 leading-5'>
              Atualize os dados antes de reenviar o convite.
            </DialogDescription>
          </div>
        </DialogHeader>
        <form className='p-6' onSubmit={submitForm(handleSubmit)} noValidate>
          <div className='grid gap-4'>
            <Label className='grid gap-1.5 text-sm font-bold'>
              Nome
              <Input
                {...register('name')}
                aria-invalid={Boolean(errors.name)}
                className='min-h-11 rounded-lg bg-card px-3'
              />
            </Label>
            <Label className='grid gap-1.5 text-sm font-bold'>
              E-mail
              <Input
                {...register('email')}
                aria-invalid={Boolean(errors.email)}
                className='min-h-11 rounded-lg bg-card px-3'
                type='email'
              />
            </Label>
            {errors.name?.message || errors.email?.message ? (
              <p className='text-sm text-destructive' role='alert'>
                {errors.name?.message ?? errors.email?.message}
              </p>
            ) : null}
          </div>
          {error ? (
            <p className='mt-4 text-sm text-destructive' role='alert'>
              {error.message}
            </p>
          ) : null}
          <DialogFooter className='mt-6 -mx-6 -mb-6 sm:flex-row sm:justify-end'>
            <Button
              variant='outline'
              className='min-h-10 rounded-lg px-4 font-bold'
              onClick={onClose}
              type='button'
            >
              Cancelar
            </Button>
            <Button
              className='min-h-10 rounded-lg px-4 font-bold'
              disabled={pending}
              type='submit'
            >
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
