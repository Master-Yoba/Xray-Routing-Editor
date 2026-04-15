import './fields.css'

interface Props {
  label: string
  value: string[]
  placeholder?: string
  onChange: (val: string[]) => void
}

export function StringListInput({ label, value, placeholder, onChange }: Props) {
  const text = value.join('\n')

  const handleChange = (raw: string) => {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
    onChange(lines)
  }

  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <textarea
        className="string-list-input"
        rows={Math.max(3, value.length + 1)}
        value={text}
        placeholder={placeholder ?? 'One entry per line'}
        onChange={(e) => handleChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  )
}
