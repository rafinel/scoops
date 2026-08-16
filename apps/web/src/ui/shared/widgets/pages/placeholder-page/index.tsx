import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'

export type PlaceholderPageProps = {
  title: string
  description: string
  icon: IconName
}

export const PlaceholderPage = ({ title, description, icon }: PlaceholderPageProps) => (
  <section className='flex flex-1 items-center justify-center py-8'>
    <div className='w-full max-w-xl rounded-2xl border bg-card p-8 text-center shadow-card'>
      <span className='mx-auto grid size-12 place-items-center rounded-xl bg-accent text-primary'>
        <Icon name={icon} className='size-6' />
      </span>
      <p className='mt-6 text-xs font-extrabold uppercase tracking-[0.16em] text-primary'>
        Em breve
      </p>
      <h1 className='mt-2 text-3xl font-extrabold tracking-tight'>{title}</h1>
      <p className='mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground'>
        {description}
      </p>
    </div>
  </section>
)
