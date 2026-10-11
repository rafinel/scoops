import { motion } from 'motion/react'
import type { LandingFaqQuestion } from '../content'

export type LandingFaqAnswerProps = {
  question: LandingFaqQuestion
  isReducedMotion: boolean
}

export const LandingFaqAnswer = ({
  question,
  isReducedMotion,
}: LandingFaqAnswerProps) => (
  <motion.div
    initial={false}
    animate={isReducedMotion ? { opacity: 1 } : { opacity: [0, 1] }}
    transition={{ duration: isReducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
    className='landing-faq-answer'
    id='landing-faq-answer'
    role='region'
    aria-labelledby={`landing-faq-question-${question.id}`}
  >
    <h3>{question.title}</h3>
    {question.paragraphs.map((paragraph) => (
      <p key={paragraph}>{paragraph}</p>
    ))}
  </motion.div>
)
