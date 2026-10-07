import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react'
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url'

setWasmUrl(wasmUrl)

export const RouteTransitionStatusDotLottie = () => (
  <DotLottieReact
    data-route-transition-artwork
    autoplay
    className='absolute inset-0 size-full'
    height={96}
    loop
    src='/assets/lotties/ice-cream-loading.lottie'
    style={{ height: 96, width: 96 }}
    width={96}
  />
)
