import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { LandingFaqQuestion } from '../content'

export type LandingFaqQuestionButtonProps = {
  question: LandingFaqQuestion
  isSelected: boolean
  onSelect: (id: LandingFaqQuestion['id']) => void
}

export const LandingFaqQuestionButton = ({
  question,
  isSelected,
  onSelect,
}: LandingFaqQuestionButtonProps) => (
  <Button
    id={`landing-faq-question-${question.id}`}
    className='landing-faq-question'
    variant='ghost'
    aria-expanded={isSelected}
    aria-controls='landing-faq-answer'
    onClick={() => onSelect(question.id)}
  >
    <span>{question.question}</span>
    <Icon name='chevron-right' className='landing-faq-question-arrow' />
  </Button>
)
