import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/ui/shared/lib/utils'

const switchVariants = cva(
  'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-[3px] outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed motion-reduce:transition-none',
  {
    variants: {
      tone: {
        default: 'bg-border data-checked:bg-primary',
        destructive: 'bg-border data-checked:bg-danger',
      },
    },
    defaultVariants: {
      tone: 'default',
    },
  },
)

export type SwitchProps = SwitchPrimitive.Root.Props & VariantProps<typeof switchVariants>

function Switch({ className, tone, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-focus-ring='delegated'
      data-slot='switch'
      className={cn(switchVariants({ tone }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot='switch-thumb'
        className='pointer-events-none block size-[18px] rounded-full bg-card shadow-sm transition-transform data-checked:translate-x-5 motion-reduce:transition-none'
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch, switchVariants }
