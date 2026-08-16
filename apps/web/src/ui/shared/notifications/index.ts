import { toast } from 'sonner'

function showToast(callback: () => void) {
  if (typeof window === 'undefined') return
  callback()
}

export function showErrorToast(message: string) {
  showToast(() => toast.error(message))
}

export function showInfoToast(message: string) {
  showToast(() => toast.info(message))
}

export function showWarningToast(message: string) {
  showToast(() => toast.warning(message))
}
