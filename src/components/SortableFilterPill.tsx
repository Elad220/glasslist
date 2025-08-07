'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface SortableFilterPillProps {
  category: string
  categoryCount: number
  CategoryIcon: any
  isActive: boolean
  onClick: () => void
}

export default function SortableFilterPill({ 
  category, 
  categoryCount, 
  CategoryIcon, 
  isActive, 
  onClick 
}: SortableFilterPillProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    active,
  } = useSortable({ id: category })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 9999 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        // Only trigger onClick if not dragging and not clicking the drag handle
        if (!isDragging && !(e.target as HTMLElement).closest('.filter-pill-drag-handle')) {
          onClick()
        }
      }}
      className={`filter-pill-draggable px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap cursor-pointer ${
        isDragging ? 'filter-pill-dragging' : ''
      } ${
        isActive
          ? 'bg-primary/20 text-primary border border-primary/30' 
          : 'glass-button'
      } ${isDragging ? '' : 'transition-colors'}`}
    >
      <span 
        {...attributes}
        {...listeners}
        className="filter-pill-drag-handle"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3 text-gray-400" />
      </span>
      <CategoryIcon className="w-2.5 h-2.5 flex-shrink-0" />
      <span className="truncate text-xs">{category}</span>
      <span className="bg-glass-white-light px-1 py-0.5 rounded-full text-[9px] min-w-[14px] text-center leading-none flex-shrink-0">
        {categoryCount}
      </span>
    </div>
  )
}
