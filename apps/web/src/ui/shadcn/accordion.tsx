'use client'

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { ChevronDownIcon } from 'lucide-react'

import { cn } from '@/ui/shared/lib/utils'

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot='accordion'
      className={cn('w-full', className)}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot='accordion-item'
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card text-sm text-card-foreground shadow-card',
        className,
      )}
      {...props}
    />
  )
}

function AccordionHeader({ className, ...props }: AccordionPrimitive.Header.Props) {
  return (
    <AccordionPrimitive.Header
      data-slot='accordion-header'
      className={cn('border-b border-border-soft', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Trigger
      data-slot='accordion-trigger'
      className={cn(
        'flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-base leading-snug font-medium outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:px-6',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        aria-hidden='true'
        className='size-4 shrink-0 transition-transform duration-200 data-panel-open:rotate-180'
      />
    </AccordionPrimitive.Trigger>
  )
}

function AccordionPanel({ className, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot='accordion-panel'
      className={cn(
        'h-[var(--accordion-panel-height)] overflow-hidden transition-[height,opacity] duration-200 ease-out data-ending-style:h-0 data-ending-style:opacity-0 data-starting-style:h-0 data-starting-style:opacity-0 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  )
}

export { Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionPanel }
