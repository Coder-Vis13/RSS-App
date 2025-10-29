import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const PriorityList = ({ items, onUpdate }) => {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const reorderedItems = arrayMove(items, active.index, over.index);
      onUpdate(reorderedItems);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="sortable-list">
          {items.map((item, index) => (
            <SortableItem key={item.id} id={item.id} index={index} item={item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
