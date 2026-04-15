import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import './fields.css'

interface Props {
  label: string
  value: string[]
  options: string[]
  placeholder?: string
  onChange: (val: string[]) => void
}

export function TagMultiSelect({ label, value, options, placeholder = 'Add...', onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setInput('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(
    (o) => !value.includes(o) && o.toLowerCase().includes(input.toLowerCase())
  )

  const add = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setInput('')
  }

  const remove = (tag: string) => {
    onChange(value.filter((v) => v !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      add(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <div className="tag-multiselect" ref={ref}>
        <div className="tag-multiselect-box" onClick={() => setOpen(true)}>
          {value.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
              <button
                type="button"
                className="chip-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(tag)
                }}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            className="tag-input"
            value={input}
            placeholder={value.length === 0 ? placeholder : ''}
            onChange={(e) => {
              setInput(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
          />
        </div>
        {open && (filtered.length > 0 || (input.trim() && !value.includes(input.trim()))) && (
          <div className="dropdown">
            <div className="dropdown-list">
              {input.trim() && !value.includes(input.trim()) && !options.includes(input.trim()) && (
                <div className="dropdown-item add-new" onClick={() => add(input)}>
                  Add "{input.trim()}"
                </div>
              )}
              {filtered.map((opt) => (
                <div key={opt} className="dropdown-item" onClick={() => add(opt)}>
                  {opt}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
