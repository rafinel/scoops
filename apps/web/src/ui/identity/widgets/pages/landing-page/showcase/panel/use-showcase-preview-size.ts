import { useLayoutEffect, useRef, useState } from 'react'

export function useShowcasePreviewSize() {
  const previewScope = useRef<HTMLDivElement>(null)
  const [previewWidth, setPreviewWidth] = useState(960)
  useLayoutEffect(() => {
    if (!previewScope.current) return
    const element = previewScope.current
    function syncWidth() {
      setPreviewWidth(element.clientWidth)
    }
    syncWidth()
    const observer = new ResizeObserver(syncWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return {
    previewScope,
    isCompact: previewWidth < 600,
    previewScale: previewWidth / 960,
    previewHeight: (previewWidth * 540) / 960,
  }
}
