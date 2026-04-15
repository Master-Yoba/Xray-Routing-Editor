import './Toolbar.css'

interface Props {
  filePath: string | null
  dirty: boolean
  hasConfig: boolean
  onOpen: () => void
  onSave: () => void
  onSaveAs: () => void
  onAddRule: () => void
  onPreview: () => void
}

export function Toolbar({
  filePath,
  dirty,
  hasConfig,
  onOpen,
  onSave,
  onSaveAs,
  onAddRule,
  onPreview
}: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="app-title">Xray Routing Editor</span>
        {filePath && (
          <span className="file-path" title={filePath}>
            {dirty && <span className="dirty-dot">●</span>}
            {shortPath(filePath)}
          </span>
        )}
      </div>

      <div className="toolbar-right">
        <button className="btn btn-secondary" onClick={onOpen}>
          Open
        </button>
        {hasConfig && (
          <>
            <button className="btn btn-ghost" onClick={onPreview} title="Preview routing section as it will be saved">
              Preview
            </button>
            <button className="btn btn-secondary" onClick={onSaveAs}>
              Save As
            </button>
            <button
              className={`btn btn-primary ${dirty ? 'dirty' : ''}`}
              disabled={!dirty}
              onClick={onSave}
              title={filePath ?? 'No file open'}
            >
              Save
            </button>
            <div className="separator" />
            <button className="btn btn-accent" onClick={onAddRule}>
              + Add Rule
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function shortPath(p: string): string {
  const parts = p.replace(/\\/g, '/').split('/')
  if (parts.length <= 3) return p
  return '…/' + parts.slice(-2).join('/')
}
