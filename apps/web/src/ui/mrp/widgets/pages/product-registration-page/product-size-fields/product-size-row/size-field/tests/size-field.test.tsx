import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SizeField } from '..'

describe('SizeField', () => {
  afterEach(cleanup)

  it('labels its control and renders no error by default', () => {
    render(
      <SizeField id='size-1-name' label='Nome'>
        <input id='size-1-name' />
      </SizeField>,
    )

    expect(screen.getByLabelText('Nome')).not.toBeNull()
    expect(document.getElementById('size-1-name-error')).toBeNull()
  })

  it('renders the error under the control with the id used by aria-describedby', () => {
    render(
      <SizeField error='Informe o nome do tamanho.' id='size-1-name' label='Nome'>
        <input id='size-1-name' />
      </SizeField>,
    )

    expect(screen.getByText('Informe o nome do tamanho.').id).toBe('size-1-name-error')
  })
})
