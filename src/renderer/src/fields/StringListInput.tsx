import { useState, useRef, useEffect } from 'react'
import './fields.css'

interface Props {
  label: string
  value: string[]
  placeholder?: string
  onChange: (val: string[]) => void
}

export function StringListInput({ label, value, placeholder, onChange }: Props) {
  const [localText, setLocalText] = useState(() => value.join('\n'))

  // We need a ref so the effect below can read the current localText
  // without listing it as a dependency (which would sync on every keystroke).
  const localTextRef = useRef(localText)
  localTextRef.current = localText

  // Sync FROM parent only when the content meaningfully changed
  // (e.g. a different rule was loaded). Ignores changes that originated
  // here — that keeps mid-edit trailing newlines intact.
  useEffect(() => {
    const localLines = localTextRef.current
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    const same =
      localLines.length === value.length && localLines.every((l, i) => l === value[i])
    if (!same) {
      setLocalText(value.join('\n'))
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (raw: string) => {
    setLocalText(raw)
    // Report parsed lines to parent but don't let parent overwrite textarea
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
    onChange(lines)
  }

  const lineCount = localText.split('\n').length

  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <textarea
        className="string-list-input"
        rows={Math.max(3, lineCount + 1)}
        value={localText}
        placeholder={placeholder ?? 'One entry per line'}
        onChange={(e) => handleChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  )
}
