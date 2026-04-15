import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { RuleObject, ExtractedTags } from '../types'
import { ruleSummary } from '../configIO'
import { RuleEditor } from './RuleEditor'
import './RuleCard.css'

interface Props {
  rule: RuleObject
  index: number
  expanded: boolean
  tags: ExtractedTags
  onToggle: () => void
  onChange: (updated: RuleObject) => void
  onDelete: () => void
}

export function RuleCard({ rule, index, expanded, tags, onToggle, onChange, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rule._id!
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  const target = rule.outboundTag
    ? { label: rule.outboundTag, kind: 'outbound' }
    : rule.balancerTag
      ? { label: rule.balancerTag, kind: 'balancer' }
      : { label: 'no target', kind: 'none' }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rule-card ${expanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="rule-card-header" onClick={onToggle}>
        {/* drag handle */}
        <span
          className="drag-handle"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
        >
          ⠿
        </span>

        {/* index badge */}
        <span className="rule-index">#{index + 1}</span>

        {/* target badge */}
        <span className={`target-badge target-${target.kind}`}>{target.label}</span>

        {/* summary */}
        <span className="rule-summary" title={ruleSummary(rule)}>
          {summaryConditions(rule)}
        </span>

        {/* actions */}
        <div className="card-actions">
          <button
            type="button"
            className="icon-btn delete-btn"
            title="Delete rule"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            ✕
          </button>
          <span className="expand-chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <RuleEditor rule={rule} tags={tags} onChange={onChange} />
      )}
    </div>
  )
}

function summaryConditions(rule: RuleObject): string {
  const parts: string[] = []
  if (rule.domain?.length) {
    const first = rule.domain[0]
    parts.push(rule.domain.length > 1 ? `domain: ${first} +${rule.domain.length - 1}` : `domain: ${first}`)
  }
  if (rule.ip?.length) {
    const first = rule.ip[0]
    parts.push(rule.ip.length > 1 ? `ip: ${first} +${rule.ip.length - 1}` : `ip: ${first}`)
  }
  if (rule.protocol?.length) parts.push(`proto: ${rule.protocol.join(',')}`)
  if (rule.network) parts.push(`net: ${rule.network}`)
  if (rule.port) parts.push(`port: ${rule.port}`)
  if (rule.inboundTag?.length) parts.push(`inbound: ${rule.inboundTag.join(',')}`)
  if (rule.user?.length) parts.push(`user[${rule.user.length}]`)
  if (rule.source?.length) parts.push(`src[${rule.source.length}]`)
  if (rule.name) parts.push(`"${rule.name}"`)
  return parts.join('  ·  ') || '— no conditions —'
}
