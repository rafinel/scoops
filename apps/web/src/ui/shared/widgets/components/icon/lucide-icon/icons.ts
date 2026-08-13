import {
  ArrowRight,
  Check,
  DoorOpen,
  Eye,
  EyeOff,
  IceCreamBowl,
  KeyRound,
  Link2Off,
  LockKeyhole,
  Mail,
  MailCheck,
  MailWarning,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { IconName } from '../types'

export const ICONS: Record<IconName, LucideIcon> = {
  arrow: ArrowRight,
  check: Check,
  'door-open': DoorOpen,
  eye: Eye,
  'eye-off': EyeOff,
  'ice-cream-bowl': IceCreamBowl,
  key: KeyRound,
  'link-off': Link2Off,
  lock: LockKeyhole,
  mail: Mail,
  'mail-check': MailCheck,
  'mail-warning': MailWarning,
  send: Send,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
  store: Store,
  users: Users,
}
