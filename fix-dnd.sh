#!/bin/bash

# First, let's find and remove the DragDropContext block
sed -i '/^[[:space:]]*<DragDropContext/,/^[[:space:]]*<\/DragDropContext>/d' src/app/list/\[listId\]/page.tsx

# Add the import for SortableFilterPill after the last import
sed -i '/import { CSS } from '"'"'@dnd-kit\/utilities'"'"'/a\import SortableFilterPill from '"'"'@\/components\/SortableFilterPill'"'"'' src/app/list/\[listId\]/page.tsx

# Update onDragEnd to handleDragEnd
sed -i 's/const onDragEnd = async (result: any) => {/const handleDragEnd = async (event: DragEndEvent) => {/' src/app/list/\[listId\]/page.tsx
sed -i 's/if (!result\.destination) {/const { active, over } = event\n    \n    if (!over || active.id === over.id) {/' src/app/list/\[listId\]/page.tsx
sed -i 's/const newOrder = Array\.from(orderedCategories)/const oldIndex = orderedCategories.indexOf(active.id as string)/' src/app/list/\[listId\]/page.tsx
sed -i 's/const \[removed\] = newOrder\.splice(result\.source\.index, 1)/const newIndex = orderedCategories.indexOf(over.id as string)/' src/app/list/\[listId\]/page.tsx
sed -i 's/newOrder\.splice(result\.destination\.index, 0, removed)/const newOrder = arrayMove(orderedCategories, oldIndex, newIndex)/' src/app/list/\[listId\]/page.tsx

echo "Fixed DnD implementation"
