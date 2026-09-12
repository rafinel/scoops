import type { HTMLAttributes } from 'react'

import { cn } from '@/ui/shared/lib/utils'

export type SkeletonProps = HTMLAttributes<HTMLDivElement>

export const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div
    className={cn(
      'animate-pulse rounded-md bg-muted motion-reduce:animate-none',
      className,
    )}
    {...props}
  />
)
