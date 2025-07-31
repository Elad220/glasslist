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
  } = useSortable({ id: category })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 9999 : 'auto' as any,
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
      className={`filter-pill-draggable px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
        isDragging ? 'filter-pill-dragging' : ''
      } ${
        isActive
          ? 'bg-primary/20 text-primary border border-primary/30' 
          : 'glass-button'
      }`}
    >
      <span 
        {...attributes}
        {...listeners}
        className="filter-pill-drag-handle"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </span>
      <CategoryIcon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{category}</span>
      <span className="bg-glass-white-light px-1 py-0.5 rounded-full text-[10px] min-w-[16px] text-center leading-none flex-shrink-0">
        {categoryCount}
      </span>
    </div>
  )
}
