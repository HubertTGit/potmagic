import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Trash2, Menu } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/cn';
import { DataList, DataListItem } from './data-list';

interface Scene {
  id: string;
  order: number;
  title: string;
}

interface StoryScenesTabProps {
  scenes: Scene[];
  storyId: string;
  isDirector: boolean;
  onAddScene: (title: string) => void;
  onRemoveScene: (sceneId: string, title: string) => void;
  onReorderScenes: (scenes: { id: string; order: number }[]) => void;
  isAddingScene: boolean;
  isRemovingScene: boolean;
}

interface SortableSceneRowProps {
  scene: Scene;
  index: number;
  storyId: string;
  isDirector: boolean;
  isRemovingScene: boolean;
  onRemoveScene: (id: string, title: string) => void;
}

function SortableSceneRow({
  scene,
  index,
  storyId,
  isDirector,
  isRemovingScene,
  onRemoveScene,
}: SortableSceneRowProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  // Inline style is the sole exception to the no-inline-styles rule:
  // @dnd-kit's CSS.Transform produces a dynamic translate3d value that
  // cannot be expressed as a Tailwind class.
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'list-row group flex items-center gap-2 cursor-pointer',
        'hover:bg-base-200/50 transition-colors',
        'first:rounded-t-box last:rounded-b-box',
        isDragging && 'opacity-50',
      )}
      onClick={() =>
        navigate({
          to: '/stories/$storyId/scenes/$sceneId',
          params: { storyId, sceneId: scene.id },
        })
      }
    >
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center">
          {isDirector && (
            <button
              className="cursor-grab active:cursor-grabbing text-base-content/20 hover:text-base-content/50 transition-colors p-2 shrink-0"
              aria-label="Drag to reorder"
              onClick={(e) => e.stopPropagation()}
              {...attributes}
              {...listeners}
            >
              <Menu className="size-4" />
            </button>
          )}
          <div className="text-base-content/40 text-sm tabular-nums font-medium w-6 shrink-0">
            {index + 1}.
          </div>
          <div className="list-col-grow text-sm font-medium">{scene.title}</div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-base-content/20 group-hover:text-base-content/40 transition-colors mr-1">
            Click to view details →
          </span>
          {isDirector && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveScene(scene.id, scene.title);
              }}
              disabled={isRemovingScene}
              className="text-xs text-error/60 hover:text-error transition-colors p-2 hover:bg-error/10 rounded-lg"
              title="Remove scene"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export function StoryScenesTab({
  scenes,
  storyId,
  isDirector,
  onAddScene,
  onRemoveScene,
  onReorderScenes,
  isAddingScene,
  isRemovingScene,
}: StoryScenesTabProps) {
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [localScenes, setLocalScenes] = useState(scenes);

  useEffect(() => {
    setLocalScenes(scenes);
  }, [scenes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAddScene = () => {
    if (!newSceneTitle.trim()) return;
    onAddScene(newSceneTitle.trim());
    setNewSceneTitle('');
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localScenes.findIndex((s) => s.id === active.id);
    const newIndex = localScenes.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(localScenes, oldIndex, newIndex);
    setLocalScenes(reordered);
    onReorderScenes(reordered.map((s, i) => ({ id: s.id, order: i + 1 })));
  }

  return (
    <div>
      {localScenes.length === 0 ? (
        <DataList>
          <DataListItem className="p-4 text-base-content/40 text-sm">
            No scenes yet.
          </DataListItem>
        </DataList>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localScenes.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <DataList>
              {localScenes.map((scene, index) => (
                <SortableSceneRow
                  key={scene.id}
                  scene={scene}
                  index={index}
                  storyId={storyId}
                  isDirector={isDirector}
                  isRemovingScene={isRemovingScene}
                  onRemoveScene={onRemoveScene}
                />
              ))}
            </DataList>
          </SortableContext>
        </DndContext>
      )}

      {isDirector && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newSceneTitle}
            onChange={(e) => setNewSceneTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddScene();
            }}
            placeholder="Scene title…"
            className="input input-sm bg-base-200 border-base-300 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/10 w-56"
          />
          <button
            onClick={handleAddScene}
            disabled={isAddingScene || !newSceneTitle.trim()}
            className={cn(
              'btn btn-sm btn-primary font-display',
              (isAddingScene || !newSceneTitle.trim()) &&
                'opacity-40 cursor-not-allowed',
            )}
          >
            + Add Scene
          </button>
        </div>
      )}
    </div>
  );
}
