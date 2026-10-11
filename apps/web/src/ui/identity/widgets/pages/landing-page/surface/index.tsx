import type { ReactNode } from 'react'

import { useLandingSurface } from './use-landing-surface'

export type LandingSurfaceProps = {
  children: ReactNode
}

export const LandingSurface = ({ children }: LandingSurfaceProps) => {
  const { canvasRef, handlePointerEnter, handlePointerMove, handlePointerLeave } =
    useLandingSurface()

  return (
    <div
      className='landing-panel landing-surface relative isolate overflow-hidden rounded-xl text-primary-foreground'
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <canvas
        ref={canvasRef}
        aria-hidden='true'
        tabIndex={-1}
        inert
        className='landing-mesh pointer-events-none absolute inset-0 -z-10 h-full w-full'
      />
      {children}
    </div>
  )
}
