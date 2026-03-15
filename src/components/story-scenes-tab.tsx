import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { TrashIcon } from '@heroicons/react/24/outline';
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
  isAddingScene: boolean;
  isRemovingScene: boolean;
}

export function StoryScenesTab({
  scenes,
  storyId,
  isDirector,
  onAddScene,
  onRemoveScene,
  isAddingScene,
  isRemovingScene,
}: StoryScenesTabProps) {
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const navigate = useNavigate();

  const handleAddScene = () => {
    if (!newSceneTitle.trim()) return;
    onAddScene(newSceneTitle.trim());
    setNewSceneTitle('');
  };

  return (
    <div>
      <DataList>
        {scenes.length === 0 ? (
          <DataListItem className="p-4 text-base-content/40 text-sm">No scenes yet.</DataListItem>
        ) : (
          scenes.map((scene) => (
            <DataListItem
              key={scene.id}
              className="hover:bg-base-200"
              onClick={() => navigate({ to: '/stories/$storyId/scenes/$sceneId', params: { storyId, sceneId: scene.id } })}
            >
              <div className="text-base-content/40 text-sm tabular-nums font-medium w-6">
                {scene.order}.
              </div>
              <div className="list-col-grow text-sm font-medium">
                {scene.title}
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
                    <TrashIcon className="size-4" />
                  </button>
                )}
              </div>
            </DataListItem>
          ))
        )}
      </DataList>

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
            className="input input-sm bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10 w-56"
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
