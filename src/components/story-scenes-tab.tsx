import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';

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

  const handleAddScene = () => {
    if (!newSceneTitle.trim()) return;
    onAddScene(newSceneTitle.trim());
    setNewSceneTitle('');
  };

  return (
    <div>
      <div className="flex flex-col gap-2 mb-4">
        {scenes.length === 0 ? (
          <p className="text-base-content/40 text-sm">No scenes yet.</p>
        ) : (
          scenes.map((scene) => (
            <div
              key={scene.id}
              className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300"
            >
              <span className="text-sm">
                <span className="text-base-content/40 mr-2">{scene.order}.</span>
                {scene.title}
              </span>
              <div className="flex items-center gap-3">
                <Link
                  to="/stories/$storyId/scenes/$sceneId"
                  params={{ storyId, sceneId: scene.id }}
                  className="btn btn-xs btn-primary font-display tracking-[0.05em]"
                >
                  Details →
                </Link>
                {isDirector && (
                  <button
                    onClick={() => onRemoveScene(scene.id, scene.title)}
                    disabled={isRemovingScene}
                    className="text-xs text-error/60 hover:text-error transition-colors"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

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
