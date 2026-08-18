import {
  showErrorToast,
  showInfoToast,
  showWarningToast,
} from '@/ui/shared/notifications'

export function useToast() {
  return { showErrorToast, showInfoToast, showWarningToast }
}
