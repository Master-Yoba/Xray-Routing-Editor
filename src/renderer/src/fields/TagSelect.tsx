import { useState, useRef, useEffect } from 'react'
import './fields.css'

interface Props {
  label: string
  value: string
  options: string[]
  placeholder?: string
  onChange: (val: string) => void
}

export function TagSelect({ label, value, options, placeholder = '— none —', onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setFilter('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter((o) => o.toLowerCase().includes(filter.toLowerCase()))

  const select = (val: string) => {
    onChange(val)
    setOpen(false)
    setFilter('')
  }

  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <div className="tag-select" ref={ref}>
        <button
          type="button"
          className={`tag-select-trigger ${value ? 'has-value' : ''}`}
          onClick={() => setOpen((o) => !o)}
        >
          <span>{value || placeholder}</span>
          {value && (
            <span
              className="clear-btn"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
            >
              ✕
            </span>
          )}
          <span className="chevron">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="dropdown">
            <input
              autoFocus
              className="dropdown-filter"
              placeholder="Filter..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="dropdown-list">
              <div className="dropdown-item empty-item" onClick={() => select('')}>
                {placeholder}
              </div>
              {filtered.map((opt) => (
                <div
                  key={opt}
                  className={`dropdown-item ${opt === value ? 'selected' : ''}`}
                  onClick={() => select(opt)}
                >
                  {opt}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="dropdown-item disabled">No matches</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
