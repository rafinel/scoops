import { useAcceptUserInvitationPage } from './use-accept-user-invitation-page'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

export const INVITATION_PASSWORD_MAX_LENGTH = 64

export const AcceptUserInvitationPage = () => {
  const { acceptanceError, error, handleGoToApp, password, register, state, submit } =
    useAcceptUserInvitationPage()

  return (
    <main className='grid min-h-screen place-items-center bg-background px-4 py-8'>
      <section className='w-full max-w-md rounded-2xl border bg-card p-6 shadow-card sm:p-8'>
        {state === 'accepted' ? (
          <div aria-live='polite'>
            <p className='text-xs font-extrabold uppercase tracking-[0.16em] text-primary'>
              Tudo pronto
            </p>
            <h1 className='mt-3 text-2xl font-black'>Convite aceito</h1>
            <p className='mt-3 text-sm text-muted-foreground'>
              Sua senha foi criada e seu acesso está ativo.
            </p>
            <Button
              className='mt-6 min-h-11 w-full rounded-lg px-5 font-bold shadow-primary'
              onClick={() => void handleGoToApp()}
              type='button'
            >
              Ir para o Scoops
            </Button>
          </div>
        ) : (
          <>
            <p className='text-xs font-extrabold uppercase tracking-[0.16em] text-primary'>
              Scoops
            </p>
            <h1 className='mt-3 text-2xl font-black'>Ative seu acesso</h1>
            {state === 'idle' ? (
              <p className='mt-3 text-sm text-muted-foreground'>
                Este convite não é válido ou já foi utilizado.
              </p>
            ) : (
              <form className='mt-6 grid gap-4' onSubmit={submit}>
                <Label className='grid gap-1.5 text-sm font-bold'>
                  Crie uma senha
                  <Input
                    {...register('password')}
                    autoComplete='new-password'
                    className='min-h-11 rounded-lg px-3'
                    minLength={8}
                    maxLength={INVITATION_PASSWORD_MAX_LENGTH}
                    required
                    type='password'
                    value={password}
                  />
                </Label>
                <p className='text-xs text-muted-foreground'>Use de 8 a 64 caracteres.</p>
                {error || acceptanceError ? (
                  <p className='text-sm text-destructive' role='alert'>
                    {error ?? (acceptanceError as Error)?.message}
                  </p>
                ) : null}
                <Button
                  className='min-h-11 rounded-lg px-5 font-bold shadow-primary'
                  disabled={state === 'submitting' || password.length < 8}
                  type='submit'
                >
                  {state === 'submitting' ? 'Ativando…' : 'Ativar acesso'}
                </Button>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  )
}
