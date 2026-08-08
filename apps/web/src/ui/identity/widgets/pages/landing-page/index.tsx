import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const LandingPage = () => {
  return (
    <AppLayout>
      <section className='flex flex-1 items-center justify-center'>
        <div className='max-w-2xl text-center'>
          <p className='mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-primary'>
            Ice cream · Açaí · Frozen treats
          </p>
          <h1 className='text-4xl font-extrabold tracking-tight sm:text-6xl'>
            Welcome to Scoops
          </h1>
          <p className='mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg'>
            The operational platform for managing your store, inventory, production,
            sales, and subscription.
          </p>
        </div>
      </section>
    </AppLayout>
  )
}
