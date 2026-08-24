import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AccompanimentTypeFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AccompanimentTypesPage } from '../index'
import { useAccompanimentTypesPage } from '../use-accompaniment-types-page'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, ...props }: { children: React.ReactNode }) => (
    <a href='/products' {...props}>
      {children}
    </a>
  ),
}))
vi.mock('../use-accompaniment-types-page', () => ({ useAccompanimentTypesPage: vi.fn() }))
const useAccompanimentTypesPageMock = vi.mocked(useAccompanimentTypesPage)
const pageData = {
  items: [
    {
      type: AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' }),
      usageCount: 0,
    },
  ],
  page: 1,
  pageSize: 10,
  total: 1,
  totalPages: 1,
}
const createView = () => ({
  data: undefined,
  isError: false,
  isLoading: false,
  handleActionOpenChange: vi.fn(),
  handleActionSuccess: vi.fn(),
  handleBack: vi.fn(),
  handleRetry: vi.fn(),
  onPageChange: vi.fn(),
  selectedAction: undefined,
  setSelectedAction: vi.fn(),
})

describe('AccompanimentTypesPage', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    useAccompanimentTypesPageMock.mockReturnValue(createView())
  })

  it('renders the heading and empty state action', () => {
    render(<AccompanimentTypesPage onPageChange={vi.fn()} page={1} />)
    expect(screen.getByRole('heading', { name: 'Tipos de acompanhamento' })).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Novo tipo' })[0])
    expect(
      useAccompanimentTypesPageMock.mock.results[0].value.setSelectedAction,
    ).toHaveBeenCalledWith({ kind: 'create' })
  })

  it('renders loading, error and populated states', () => {
    useAccompanimentTypesPageMock.mockReturnValue({ ...createView(), isLoading: true })
    const { rerender } = render(
      <AccompanimentTypesPage onPageChange={vi.fn()} page={1} />,
    )
    expect(
      screen.getByRole('status', { name: 'Carregando tipos de acompanhamento' }),
    ).toBeTruthy()

    const handleRetry = vi.fn()
    useAccompanimentTypesPageMock.mockReturnValue({
      ...createView(),
      isError: true,
      handleRetry,
    })
    rerender(<AccompanimentTypesPage onPageChange={vi.fn()} page={1} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(handleRetry).toHaveBeenCalledTimes(1)

    useAccompanimentTypesPageMock.mockReturnValue({ ...createView(), data: pageData })
    rerender(<AccompanimentTypesPage onPageChange={vi.fn()} page={1} />)
    expect(screen.getByText('Cobertura')).toBeTruthy()
  })
})
