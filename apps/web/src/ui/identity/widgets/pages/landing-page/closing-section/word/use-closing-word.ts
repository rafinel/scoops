import { type MotionValue, useTransform } from 'motion/react'
import { CLOSING_WORDS } from '../content'

export function useClosingWord(progress: MotionValue<number>, index: number) {
  const start = index / CLOSING_WORDS.length
  const end = (index + 1) / CLOSING_WORDS.length
  const opacity = useTransform(progress, [start, end], [0, 1])

  return { opacity }
}
