import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from './App'

vi.mock('./components/Toolbar', () => ({
  Toolbar: ({
    onOpen,
    onSave,
    onSaveAs,
    onAddRule,
    onPreview,
    dirty,
    filePath
  }: {
    onOpen: () => void
    onSave: () => void
    onSaveAs: () => void
    onAddRule: () => void
    onPreview: () => void
    dirty: boolean
    filePath: string | null
  }) => (
    <div>
      <div data-testid="toolbar-state">{dirty ? 'dirty' : 'clean'}:{filePath ?? 'none'}</div>
      <button onClick={onOpen}>Open</button>
      <button onClick={onSave}>Save</button>
      <button onClick={onSaveAs}>Save As</button>
      <button onClick={onAddRule}>Add Rule</button>
      <button onClick={onPreview}>Preview</button>
    </div>
  )
}))

vi.mock('./components/RuleList', () => ({
  RuleList: ({
    rules,
    onChange
  }: {
    rules: Array<{ _id?: string; outboundTag?: string }>
    onChange: (rules: Array<{ type: 'field'; _id?: string; outboundTag?: string }>) => void
  }) => (
    <div>
      <div data-testid="rule-count">{rules.length}</div>
      <button
        onClick={() =>
          onChange(
            rules.map((rule, index) =>
              index === 0 ? { ...rule, type: 'field', outboundTag: 'block' } : { ...rule, type: 'field' }
            )
          )
        }
      >
        Mutate Rules
      </button>
    </div>
  )
}))

vi.mock('./components/PreviewModal', () => ({
  PreviewModal: ({ oldContent, newContent, onClose }: { oldContent: string; newContent: string; onClose: () => void }) => (
    <div>
      <div data-testid="preview-old">{oldContent}</div>
      <div data-testid="preview-new">{newContent}</div>
      <button onClick={onClose}>Close Preview</button>
    </div>
  )
}))

const openConfig = vi.fn()
const saveConfig = vi.fn()
const saveConfigAs = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  window.electronAPI = {
    openConfig,
    saveConfig,
    saveConfigAs
  }
})

describe('App', () => {
  it('opens a config, marks changes dirty, previews, saves, and clears dirty state', async () => {
    openConfig.mockResolvedValue({
      path: '/tmp/example.json',
      text: `{
  "routing": {
    "rules": [{ "type": "field", "outboundTag": "direct" }]
  }
}`
    })
    saveConfig.mockResolvedValue(undefined)

    render(<App />)

    fireEvent.click(screen.getByText('Open'))
    await screen.findByTestId('rule-count')

    expect(screen.getByTestId('toolbar-state')).toHaveTextContent('clean:/tmp/example.json')

    fireEvent.click(screen.getByText('Add Rule'))
    expect(screen.getByTestId('toolbar-state')).toHaveTextContent('dirty:/tmp/example.json')

    fireEvent.click(screen.getByText('Preview'))
    expect(screen.getByTestId('preview-new')).toHaveTextContent('"rules"')

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(saveConfig).toHaveBeenCalledTimes(1))
    expect(saveConfig).toHaveBeenCalledWith('/tmp/example.json', expect.stringContaining('"routing"'))
    await waitFor(() =>
      expect(screen.getByTestId('toolbar-state')).toHaveTextContent('clean:/tmp/example.json')
    )
  })

  it('shows an error banner when opening fails', async () => {
    openConfig.mockRejectedValue(new Error('boom'))

    render(<App />)
    fireEvent.click(screen.getByText('Open'))

    expect(await screen.findByText('⚠ Failed to open config: Error: boom')).toBeInTheDocument()
  })

  it('updates the path when save as returns a new destination', async () => {
    openConfig.mockResolvedValue({
      path: '/tmp/example.json',
      text: `{"routing":{"rules":[]}}`
    })
    saveConfigAs.mockResolvedValue('/tmp/copied.json')

    render(<App />)

    fireEvent.click(screen.getByText('Open'))
    await screen.findByTestId('rule-count')
    fireEvent.click(screen.getByText('Add Rule'))
    fireEvent.click(screen.getByText('Save As'))

    await waitFor(() =>
      expect(screen.getByTestId('toolbar-state')).toHaveTextContent('clean:/tmp/copied.json')
    )
  })
})
