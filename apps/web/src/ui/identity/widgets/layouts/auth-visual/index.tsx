import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'

export type AuthVisualVariant =
  | 'account-unconfirmed'
  | 'invalid-recovery'
  | 'login'
  | 'new-password'
  | 'password-updated'
  | 'recovery'
  | 'verify-email'

type AuthVisualCardConfig = {
  eyebrow: string
  icon: IconName
  iconClass: string
  iconBackgroundClass: string
  positionClass: string
  title: string
  trailingIcon?: IconName
  wide?: boolean
}

type AuthVisualConfig = {
  badge: string
  badgeIcon: IconName
  badgeTextClass: string
  centerIcon: IconName
  centerIconClass: string
  haloClass: string
  subtitle: string
  title: string
  cards: [AuthVisualCardConfig, AuthVisualCardConfig, AuthVisualCardConfig]
}

const card = (
  eyebrow: string,
  title: string,
  icon: IconName,
  positionClass: string,
  iconClass = 'text-primary',
  iconBackgroundClass = 'bg-primary-soft',
  wide = false,
  trailingIcon?: IconName,
): AuthVisualCardConfig => ({
  eyebrow,
  icon,
  iconClass,
  iconBackgroundClass,
  positionClass,
  title,
  trailingIcon,
  wide,
})

const visualConfigs: Record<AuthVisualVariant, AuthVisualConfig> = {
  recovery: {
    badge: 'RECUPERAÇÃO DE ACESSO',
    badgeIcon: 'key',
    badgeTextClass: 'text-primary',
    centerIcon: 'key',
    centerIconClass: 'text-primary',
    haloClass: 'bg-primary opacity-10',
    title: 'Volte ao Scoops com segurança.',
    subtitle:
      'Informe seu e-mail e siga as instruções recebidas para criar uma nova senha.',
    cards: [
      card('E-MAIL', 'Informe seu endereço', 'mail', 'left-4 top-[134px]'),
      card(
        'SEGURANÇA',
        'Resposta neutra',
        'shield-check',
        'left-[352px] top-[244px]',
        'text-success',
        'bg-success-soft',
      ),
      card(
        'PRÓXIMO PASSO',
        'Verificar o e-mail',
        'mail-check',
        'left-[100px] top-[346px]',
        'text-primary',
        'bg-primary-soft',
        true,
        'arrow',
      ),
    ],
  },
  'verify-email': {
    badge: 'VERIFIQUE SEU E-MAIL',
    badgeIcon: 'mail-check',
    badgeTextClass: 'text-primary',
    centerIcon: 'mail-check',
    centerIconClass: 'text-primary',
    haloClass: 'bg-primary opacity-10',
    title: 'Confira seu e-mail para continuar.',
    subtitle:
      'Se houver uma conta associada, as instruções chegarão ao endereço informado.',
    cards: [
      card('CAIXA DE ENTRADA', 'Confira suas mensagens', 'mail', 'left-4 top-[134px]'),
      card(
        'PRIVACIDADE',
        'Resposta protegida',
        'shield-check',
        'left-[352px] top-[244px]',
        'text-success',
        'bg-success-soft',
      ),
      card(
        'PRÓXIMO PASSO',
        'Definir nova senha',
        'key',
        'left-[100px] top-[346px]',
        'text-primary',
        'bg-primary-soft',
        true,
        'arrow',
      ),
    ],
  },
  login: {
    badge: 'ACESSO AO SCOOPS',
    badgeIcon: 'door-open',
    badgeTextClass: 'text-primary',
    centerIcon: 'door-open',
    centerIconClass: 'text-primary',
    haloClass: 'bg-primary opacity-10',
    title: 'Sua operação começa por aqui.',
    subtitle: 'Entre para acompanhar a rotina da sua sorveteria em um só lugar.',
    cards: [
      card('SORVETERIA', 'Seu espaço de gestão', 'store', 'left-4 top-[134px]'),
      card(
        'PERFIS',
        'Gerente ou operador',
        'users',
        'left-[352px] top-[244px]',
        'text-success',
        'bg-success-soft',
      ),
      card(
        'RECUPERAÇÃO',
        'Esqueci minha senha',
        'key',
        'left-[100px] top-[346px]',
        'text-primary',
        'bg-primary-soft',
        true,
        'arrow',
      ),
    ],
  },
  'account-unconfirmed': {
    badge: 'CONFIRMAÇÃO PENDENTE',
    badgeIcon: 'mail-warning',
    badgeTextClass: 'text-warning',
    centerIcon: 'mail-warning',
    centerIconClass: 'text-warning',
    haloClass: 'bg-warning opacity-10',
    title: 'Falta confirmar seu e-mail.',
    subtitle: 'Abra a mensagem de confirmação para liberar o acesso à sorveteria.',
    cards: [
      card('E-MAIL', 'Verifique sua caixa', 'mail', 'left-4 top-[134px]'),
      card(
        'ACESSO',
        'Ainda não liberado',
        'lock',
        'left-[352px] top-[244px]',
        'text-warning',
        'bg-warning-soft',
      ),
      card(
        'PRÓXIMO PASSO',
        'Confirmar o e-mail',
        'mail-check',
        'left-[100px] top-[346px]',
        'text-primary',
        'bg-primary-soft',
        true,
        'arrow',
      ),
    ],
  },
  'new-password': {
    badge: 'NOVA SENHA',
    badgeIcon: 'key',
    badgeTextClass: 'text-primary',
    centerIcon: 'shield-check',
    centerIconClass: 'text-primary',
    haloClass: 'bg-primary opacity-10',
    title: 'Uma nova chave para o seu acesso.',
    subtitle: 'Crie uma senha entre 8 e 64 caracteres e confirme antes de concluir.',
    cards: [
      card('REQUISITO', '8 a 64 caracteres', 'key', 'left-4 top-[134px]'),
      card(
        'CONFIRMAÇÃO',
        'Digite novamente',
        'check',
        'left-[352px] top-[244px]',
        'text-success',
        'bg-success-soft',
      ),
      card(
        'AO CONCLUIR',
        'Sessões encerradas',
        'door-open',
        'left-[100px] top-[346px]',
        'text-primary',
        'bg-primary-soft',
        true,
        'arrow',
      ),
    ],
  },
  'password-updated': {
    badge: 'SENHA ATUALIZADA',
    badgeIcon: 'check',
    badgeTextClass: 'text-success',
    centerIcon: 'shield-check',
    centerIconClass: 'text-success',
    haloClass: 'bg-success opacity-10',
    title: 'Seu acesso está protegido novamente.',
    subtitle: 'Entre no Scoops usando a nova senha.',
    cards: [
      card(
        'NOVA SENHA',
        'Pronta para uso',
        'key',
        'left-4 top-[134px]',
        'text-success',
        'bg-success-soft',
      ),
      card(
        'SESSÕES',
        'Anteriores encerradas',
        'door-open',
        'left-[352px] top-[244px]',
        'text-success',
        'bg-success-soft',
      ),
      card(
        'PRÓXIMO PASSO',
        'Entrar novamente',
        'door-open',
        'left-[100px] top-[346px]',
        'text-success',
        'bg-success-soft',
        true,
        'arrow',
      ),
    ],
  },
  'invalid-recovery': {
    badge: 'LINK DE RECUPERAÇÃO INDISPONÍVEL',
    badgeIcon: 'link-off',
    badgeTextClass: 'text-danger',
    centerIcon: 'link-off',
    centerIconClass: 'text-danger',
    haloClass: 'bg-danger opacity-10',
    title: 'Solicite um novo link para continuar.',
    subtitle:
      'Links inválidos, expirados ou já utilizados não podem redefinir sua senha.',
    cards: [
      card(
        'LINK',
        'Inválido ou expirado',
        'link-off',
        'left-4 top-[134px]',
        'text-danger',
        'bg-danger-bg',
      ),
      card(
        'SEGURANÇA',
        'Senha não alterada',
        'lock',
        'left-[352px] top-[244px]',
        'text-warning',
        'bg-warning-soft',
      ),
      card(
        'PRÓXIMO PASSO',
        'Solicitar novo link',
        'send',
        'left-[100px] top-[346px]',
        'text-primary',
        'bg-primary-soft',
        true,
        'arrow',
      ),
    ],
  },
}

export type AuthVisualProps = {
  variant: AuthVisualVariant
}

export const AuthVisual = ({ variant }: AuthVisualProps) => {
  const config = visualConfigs[variant]

  return (
    <aside className='relative hidden min-h-screen flex-1 overflow-hidden bg-accent lg:flex lg:items-center lg:justify-center'>
      <div className='flex w-[624px] flex-col items-center gap-7 text-center'>
        <div className='flex w-full flex-col items-center gap-3'>
          <div className='auth-entrance-badge flex items-center gap-[7px] rounded-full border border-border bg-card px-[11px] py-[7px]'>
            <Icon
              className={`size-3.5 ${config.badgeTextClass}`}
              name={config.badgeIcon}
            />
            <span
              className={`text-[10px] font-extrabold tracking-[1.1px] ${config.badgeTextClass}`}
            >
              {config.badge}
            </span>
          </div>
          <h2 className='auth-entrance-title w-full text-[34px] font-extrabold leading-[38px] tracking-[-1px] text-foreground'>
            {config.title}
          </h2>
          <p className='auth-entrance-subtitle w-[460px] max-w-full text-[15px] font-medium leading-[23px] text-muted-foreground'>
            {config.subtitle}
          </p>
        </div>

        <div className='relative h-[430px] w-[560px]'>
          <div
            className={`auth-entrance-halo absolute left-[140px] top-[54px] size-[280px] rounded-full ${config.haloClass}`}
          />
          <div className='auth-entrance-medallion absolute left-[170px] top-[84px] size-[220px] rounded-full bg-primary' />
          <div className='auth-entrance-center absolute left-[190px] top-[104px] size-[180px] rounded-full bg-card' />
          <Icon
            className={`auth-entrance-door absolute left-[232px] top-[146px] size-24 ${config.centerIconClass}`}
            name={config.centerIcon}
          />
          <VisualSparkles />

          {config.cards.map((cardConfig, index) => (
            <AuthVisualCard
              card={cardConfig}
              index={index}
              key={`${variant}-${cardConfig.eyebrow}`}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}

type AuthVisualCardProps = {
  card: AuthVisualCardConfig
  index: number
}

const AuthVisualCard = ({ card, index }: AuthVisualCardProps) => {
  const cardAnimationClass = [
    'auth-float-card-store auth-entrance-card-store',
    'auth-float-card-profile auth-entrance-card-profile',
    'auth-float-card-recovery auth-entrance-card-recovery',
  ][index]

  return (
    <div
      className={`${cardAnimationClass} ${card.positionClass} absolute flex items-center gap-[9px] rounded-xl border border-border bg-card px-[13px] py-[11px] text-left ${card.wide ? 'w-[360px] justify-between rounded-[14px] px-[14px] py-3' : ''}`}
    >
      <div className='flex items-center gap-[9px]'>
        <span
          className={`flex size-[30px] shrink-0 items-center justify-center rounded-[9px] ${card.iconBackgroundClass} ${card.iconClass}`}
        >
          <Icon className='size-4' name={card.icon} />
        </span>
        <span className='flex flex-col gap-px'>
          <span className='text-[9px] font-extrabold tracking-[1px] text-text-tertiary'>
            {card.eyebrow}
          </span>
          <span className='text-xs font-extrabold text-foreground'>{card.title}</span>
        </span>
      </div>
      {card.trailingIcon ? (
        <Icon className='size-4 text-primary' name={card.trailingIcon} />
      ) : null}
    </div>
  )
}

const VisualSparkles = () => (
  <>
    <Icon
      className='auth-entrance-sparkle-top absolute left-[408px] top-[70px] size-7 text-warning'
      name='sparkles'
    />
    <Icon
      className='auth-entrance-sparkle-side absolute left-[112px] top-[248px] size-[22px] text-success'
      name='sparkles'
    />
    <span className='auth-entrance-dot-yellow absolute left-[106px] top-[106px] size-3 rounded-full bg-warning-soft outline outline-1 outline-warning' />
    <span className='auth-entrance-dot-green absolute left-[436px] top-[224px] size-2.5 rounded-full bg-success-soft outline outline-1 outline-success' />
  </>
)
