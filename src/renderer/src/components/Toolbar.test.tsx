import { fireEvent, render, screen } from '@testing-library/react'
import { Toolbar } from './Toolbar'

describe('Toolbar', () => {
  it('shows a shortened path and dirty indicator', () => {
    render(
      <Toolbar
        filePath={'C:\\Users\\alex\\configs\\xray\\routing.json'}
        dirty
        hasConfig
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        onAddRule={vi.fn()}
        onPreview={vi.fn()}
      />
    )

    expect(screen.getByText('…/xray/routing.json')).toBeInTheDocument()
    expect(screen.getByText('●')).toBeInTheDocument()
  })

  it('disables save when the config is clean', () => {
    render(
      <Toolbar
        filePath="/tmp/example.json"
        dirty={false}
        hasConfig
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        onAddRule={vi.fn()}
        onPreview={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('fires visible actions when buttons are clicked', () => {
    const onOpen = vi.fn()
    const onPreview = vi.fn()
    const onSave = vi.fn()

    render(
      <Toolbar
        filePath="/tmp/example.json"
        dirty
        hasConfig
        onOpen={onOpen}
        onSave={onSave}
        onSaveAs={vi.fn()}
        onAddRule={vi.fn()}
        onPreview={onPreview}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onPreview).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
