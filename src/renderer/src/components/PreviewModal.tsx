import { useEffect, useMemo } from 'react'
import './PreviewModal.css'

// ─── Line-level diff ──────────────────────────────────────────────────────────

type DiffLine =
  | { kind: 'same'; text: string }
  | { kind: 'remove'; text: string }
  | { kind: 'add'; text: string }

function lineDiff(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split('\n')
  const b = newText.split('\n')
  const n = a.length
  const m = b.length

  // DP table for Longest Common Subsequence
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const result: DiffLine[] = []
  let i = 0,
    j = 0
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      result.push({ kind: 'same', text: a[i] })
      i++
      j++
    } else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ kind: 'add', text: b[j] })
      j++
    } else {
      result.push({ kind: 'remove', text: a[i] })
      i++
    }
  }
  return result
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  oldContent: string
  newContent: string
  onClose: () => void
}

export function PreviewModal({ oldContent, newContent, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const diff = useMemo(() => lineDiff(oldContent, newContent), [oldContent, newContent])

  const added = diff.filter((l) => l.kind === 'add').length
  const removed = diff.filter((l) => l.kind === 'remove').length
  const unchanged = diff.filter((l) => l.kind === 'same').length === diff.length

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdrop}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Preview Changes — routing section</span>
          <div className="modal-header-right">
            {unchanged ? (
              <span className="diff-stat stat-same">No changes</span>
            ) : (
              <>
                {removed > 0 && <span className="diff-stat stat-remove">−{removed}</span>}
                {added > 0 && <span className="diff-stat stat-add">+{added}</span>}
              </>
            )}
            <button className="modal-close" onClick={onClose} title="Close (Esc)">
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          {unchanged ? (
            <p className="no-changes-msg">The routing section has no unsaved changes.</p>
          ) : (
            <div className="diff-view">
              {diff.map((line, idx) => (
                <div key={idx} className={`diff-line diff-${line.kind}`}>
                  <span className="diff-gutter">
                    {line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' '}
                  </span>
                  <span className="diff-text">{line.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
