export const LandingOrderPreview = () => (
  <figure
    data-landing-enter='preview'
    className='flex w-full max-w-landing-preview flex-col items-center gap-3 rounded-xl bg-primary p-3 md:px-14 md:py-6'
  >
    <picture className='block w-full overflow-hidden rounded-xl'>
      <source
        media='(max-width: 767px)'
        srcSet='/images/landing/order-preview-mobile.png'
        width={302}
        height={592}
      />
      <img
        src='/images/landing/order-preview-desktop.png'
        alt='Prévia de um pedido no Scoops, com dados ilustrativos'
        width={624}
        height={568}
        fetchPriority='high'
        decoding='async'
        className='block h-auto w-full'
      />
    </picture>
    <figcaption className='text-xs leading-normal text-primary-foreground'>
      Pedido no Scoops. Dados ilustrativos.
    </figcaption>
  </figure>
)
