import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AccompanimentPortionCandidate } from '@scoops/core/mrp/domain/structures'

import { PortionPicker, type PortionPickerProps } from '../index'
import { usePortionPicker } from '../use-portion-picker'

vi.mock('../use-portion-picker', () => ({ usePortionPicker: vi.fn() }))

const usePortionPickerMock = vi.mocked(usePortionPicker)

const candidates: AccompanimentPortionCandidate[] = [
  { productId: 'a', name: 'Açaí 300 ml', status: 'active' },
  { productId: 'b', name: 'Sorvete de coco', status: 'inactive' },
]

function createHookState(
  overrides: Partial<ReturnType<typeof usePortionPicker>> = {},
): ReturnType<typeof usePortionPicker> {
  return {
    areAllFilteredSelected: false,
    filteredCandidates: candidates,
    hasCandidates: true,
    isLimitReached: false,
    isSearchDimmed: false,
    isSearchDisabled: false,
    limitMessage: undefined,
    labelId: 'picker-label',
    search: '',
    selectedCount: 0,
    selectedIdSet: new Set<string>(),
    selectionLabel: '0 selecionadas',
    showsToggleAll: true,
    handleSearchChange: vi.fn(),
    handleSearchKeyDown: vi.fn(),
    handleToggle: vi.fn(),
    handleToggleAll: vi.fn(),
    ...overrides,
  }
}

function renderPicker(overrides: Partial<PortionPickerProps> = {}) {
  const props: PortionPickerProps = {
    candidates,
    isError: false,
    isLoading: false,
    onRetry: vi.fn(),
    onSelectedIdsChange: vi.fn(),
    selectedIds: [],
    ...overrides,
  }
  render(<PortionPicker {...props} />)
  return props
}

describe('PortionPicker', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    usePortionPickerMock.mockReturnValue(createHookState())
  })

  it('passes its selection contract to the owning hook', () => {
    const props = renderPicker({ selectedIds: ['a'] })

    expect(usePortionPickerMock).toHaveBeenCalledWith({
      candidates,
      isError: false,
      isLoading: false,
      onRetry: props.onRetry,
      onSelectedIdsChange: props.onSelectedIdsChange,
      selectedIds: ['a'],
    })
  })

  it('renders a labelled group with a checkbox per Portion and its status as description', () => {
    renderPicker()

    const group = screen.getByRole('group', { name: 'Porções' })
    const checkboxes = within(group).getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    expect(
      within(group)
        .getByRole('checkbox', { name: 'Açaí 300 ml' })
        .getAttribute('aria-describedby'),
    ).toBeTruthy()
    expect(within(group).getByRole('checkbox', { name: 'Açaí 300 ml' })).toHaveProperty(
      'ariaChecked',
      'false',
    )
    expect(
      document.getElementById(
        within(group)
          .getByRole('checkbox', { name: 'Sorvete de coco' })
          .getAttribute('aria-describedby') ?? '',
      )?.textContent,
    ).toBe('Inativo')
    expect(
      document.getElementById(
        within(group)
          .getByRole('checkbox', { name: 'Açaí 300 ml' })
          .getAttribute('aria-describedby') ?? '',
      )?.textContent,
    ).toBe('Ativo')
  })

  it('reflects the selected ids and announces the count politely', () => {
    usePortionPickerMock.mockReturnValue(
      createHookState({ selectedIdSet: new Set(['a']), selectionLabel: '1 selecionada' }),
    )
    renderPicker({ selectedIds: ['a'] })

    expect(
      screen.getByRole('checkbox', { name: 'Açaí 300 ml' }).getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      screen
        .getByRole('checkbox', { name: 'Sorvete de coco' })
        .getAttribute('aria-checked'),
    ).toBe('false')
    const count = screen.getByText('1 selecionada')
    expect(count.getAttribute('aria-live')).toBe('polite')
  })

  it('toggles a Portion by clicking its checkbox and by clicking its label', () => {
    const handleToggle = vi.fn()
    usePortionPickerMock.mockReturnValue(createHookState({ handleToggle }))
    renderPicker()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Açaí 300 ml' }))
    fireEvent.click(screen.getByText('Sorvete de coco'))

    expect(handleToggle).toHaveBeenCalledTimes(2)
    expect(handleToggle).toHaveBeenNthCalledWith(1, 'a', true)
    expect(handleToggle).toHaveBeenNthCalledWith(2, 'b', true)
  })

  it('toggles with Enter from the keyboard instead of submitting', () => {
    const handleToggle = vi.fn()
    usePortionPickerMock.mockReturnValue(createHookState({ handleToggle }))
    renderPicker()

    fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Açaí 300 ml' }), {
      key: 'Enter',
    })

    expect(handleToggle).toHaveBeenCalledWith('a', true)
  })

  it('offers Selecionar todas and delegates it, switching to Limpar seleção when all are selected', () => {
    const handleToggleAll = vi.fn()
    usePortionPickerMock.mockReturnValue(createHookState({ handleToggleAll }))
    renderPicker()

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar todas' }))
    expect(handleToggleAll).toHaveBeenCalledTimes(1)
    cleanup()
    usePortionPickerMock.mockReturnValue(
      createHookState({ areAllFilteredSelected: true, handleToggleAll }),
    )
    renderPicker()
    expect(screen.queryByRole('button', { name: 'Selecionar todas' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar seleção' }))

    expect(handleToggleAll).toHaveBeenCalledTimes(2)
  })

  it('reports search changes and keeps the typed value', () => {
    const handleSearchChange = vi.fn()
    usePortionPickerMock.mockReturnValue(
      createHookState({ handleSearchChange, search: 'aç' }),
    )
    renderPicker()
    const input = screen.getByRole('textbox', {
      name: 'Buscar porção',
    }) as HTMLInputElement

    fireEvent.change(input, { target: { value: 'açaí' } })

    expect(input.value).toBe('aç')
    expect(handleSearchChange).toHaveBeenCalledWith('açaí')
  })

  it('shows a message and hides Selecionar todas when the search matches nothing', () => {
    usePortionPickerMock.mockReturnValue(
      createHookState({ filteredCandidates: [], search: 'zzz', showsToggleAll: false }),
    )
    renderPicker()

    expect(screen.getByText('Nenhuma porção encontrada.')).toBeTruthy()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Selecionar todas' })).toBeNull()
  })

  it('explains that every Portion already has the Accompaniment and disables the search', () => {
    usePortionPickerMock.mockReturnValue(
      createHookState({
        filteredCandidates: [],
        hasCandidates: false,
        isSearchDimmed: true,
        isSearchDisabled: true,
        showsToggleAll: false,
      }),
    )
    renderPicker({ candidates: [] })

    expect(screen.getByText('Todas as porções já têm este acompanhamento.')).toBeTruthy()
    expect(
      (screen.getByRole('textbox', { name: 'Buscar porção' }) as HTMLInputElement)
        .disabled,
    ).toBe(true)
    expect(screen.getByText('0 selecionadas')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Selecionar todas' })).toBeNull()
    expect(screen.queryByText('Nenhuma porção encontrada.')).toBeNull()
  })

  it('shows a loading status instead of rows while the Portions load', () => {
    usePortionPickerMock.mockReturnValue(
      createHookState({
        filteredCandidates: [],
        hasCandidates: false,
        isSearchDisabled: true,
        showsToggleAll: false,
      }),
    )
    renderPicker({ candidates: [], isLoading: true })

    expect(screen.getByRole('status', { name: 'Carregando porções' })).toBeTruthy()
    expect(screen.queryByText('Todas as porções já têm este acompanhamento.')).toBeNull()
    expect(
      (screen.getByRole('textbox', { name: 'Buscar porção' }) as HTMLInputElement)
        .disabled,
    ).toBe(true)
  })

  it('shows the load error with a retry inside the picker', () => {
    usePortionPickerMock.mockReturnValue(
      createHookState({
        filteredCandidates: [],
        hasCandidates: false,
        isSearchDisabled: true,
        showsToggleAll: false,
      }),
    )
    const props = renderPicker({ candidates: [], isError: true })

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar as porções.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(props.onRetry).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Todas as porções já têm este acompanhamento.')).toBeNull()
  })

  it('shows the validation message under the picker', () => {
    renderPicker({ error: 'Selecione ao menos uma porção.' })

    expect(screen.getByText('Selecione ao menos uma porção.')).toBeTruthy()
  })

  it('announces the per-link limit when the hook reports it', () => {
    usePortionPickerMock.mockReturnValue(
      createHookState({
        limitMessage:
          'Limite de 500 porções por vínculo; as demais podem ser vinculadas em seguida.',
      }),
    )
    renderPicker()

    expect(screen.getByRole('status').textContent).toBe(
      'Limite de 500 porções por vínculo; as demais podem ser vinculadas em seguida.',
    )
  })

  it('shows no limit message by default', () => {
    renderPicker()

    expect(screen.queryByRole('status')).toBeNull()
  })
  it('keeps a thin always-visible scrollbar thumb on the overflowing rows area', () => {
    renderPicker()

    const scrollArea = screen.getAllByRole('checkbox')[0].closest('.overflow-y-auto')
    expect(scrollArea?.className).toContain('max-h-[246px]')
    expect(scrollArea?.className).toContain('[&::-webkit-scrollbar]:w-1')
    expect(scrollArea?.className).toContain('[&::-webkit-scrollbar-thumb]:rounded-full')
    expect(scrollArea?.className).toContain(
      '[&::-webkit-scrollbar-thumb]:bg-[color:var(--border)]',
    )
  })
})
