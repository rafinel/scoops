import { motion, type MotionValue } from 'motion/react'
import { useClosingWord } from './use-closing-word'

export type LandingClosingWordProps = {
  word: string
  index: number
  progress: MotionValue<number>
  canHighlight: boolean
}

export const LandingClosingWord = ({
  word,
  index,
  progress,
  canHighlight,
}: LandingClosingWordProps) => {
  const { opacity } = useClosingWord(progress, index)

  return (
    <span className='landing-closing-word' aria-hidden='true'>
      <span className='landing-closing-word-base'>{word}</span>
      <motion.span
        className='landing-closing-word-highlight'
        style={{ opacity: canHighlight ? opacity : 1 }}
      >
        {word}
      </motion.span>
    </span>
  )
}
