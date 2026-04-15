import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import type { RuleObject, ExtractedTags } from '../types'
import { RuleCard } from './RuleCard'
import './RuleList.css'

interface Props {
  rules: RuleObject[]
  tags: ExtractedTags
  expandedId: string | null
  onExpand: (id: string | null) => void
  onChange: (rules: RuleObject[]) => void
}

export function RuleList({ rules, tags, expandedId, onExpand, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = rules.findIndex((r) => r._id === active.id)
    const newIdx = rules.findIndex((r) => r._id === over.id)
    onChange(arrayMove(rules, oldIdx, newIdx))
  }

  const updateRule = (id: string, updated: RuleObject) => {
    onChange(rules.map((r) => (r._id === id ? updated : r)))
  }

  const deleteRule = (id: string) => {
    onChange(rules.filter((r) => r._id !== id))
    if (expandedId === id) onExpand(null)
  }

  if (rules.length === 0) {
    return (
      <div className="empty-list">
        <p>No rules yet.</p>
        <p className="muted">Click <strong>Add Rule</strong> above to get started.</p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={rules.map((r) => r._id!)} strategy={verticalListSortingStrategy}>
        <div className="rule-list">
          {rules.map((rule, index) => (
            <RuleCard
              key={rule._id}
              rule={rule}
              index={index}
              expanded={expandedId === rule._id}
              tags={tags}
              onToggle={() => onExpand(expandedId === rule._id ? null : rule._id!)}
              onChange={(updated) => updateRule(rule._id!, updated)}
              onDelete={() => deleteRule(rule._id!)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
