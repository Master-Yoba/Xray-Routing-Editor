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

type TargetKind = 'blackhole' | 'freedom' | 'outbound' | 'balancer' | 'none'

function getTargetKind(rule: RuleObject, outboundProtocols: Record<string, string>): TargetKind {
  if (rule.balancerTag) return 'balancer'
  if (rule.outboundTag) {
    const proto = outboundProtocols[rule.outboundTag] ?? ''
    if (proto === 'blackhole') return 'blackhole'
    if (proto === 'freedom') return 'freedom'
    return 'outbound'
  }
  return 'none'
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

  const kind = getTargetKind(rule, tags.outboundProtocols)
  const targetLabel = rule.outboundTag ?? rule.balancerTag ?? 'no target'

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
        <span className={`target-badge target-${kind}`}>{targetLabel}</span>

        {/* ruleTag label (highlighted, if set) */}
        {rule.ruleTag && (
          <span className="rule-tag-label" title={`ruleTag: ${rule.ruleTag}`}>
            {rule.ruleTag}
          </span>
        )}

        {/* summary conditions */}
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

      {expanded && <RuleEditor rule={rule} tags={tags} onChange={onChange} />}
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
  return parts.join('  ·  ') || '— no conditions —'
}
