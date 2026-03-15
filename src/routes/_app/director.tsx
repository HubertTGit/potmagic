import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listStories } from '@/lib/stories.fns';
import {
  getSignedUploadUrl,
  createProp,
  listProps,
  deleteProp,
} from '@/lib/props.fns';
import { StatusBadge } from '@/components/status-badge.component';
import { cn } from '@/lib/cn';
import {
  PhotoIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { LibrarySection } from '@/components/library-section.component';
import type { LibraryItem } from '@/components/library-section.component';
import { updateStoryStatus } from '@/lib/story-detail.fns';
import type { PropType } from '@/db/schema';
import { toast } from '@/lib/toast';

export const Route = createFileRoute('/_app/director')({
  component: DirectorPage,
});

type Tab = 'dashboard' | 'library';

function DirectorPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  const queryClient = useQueryClient();
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => listStories(),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      storyId,
      status,
    }: {
      storyId: string;
      status: 'draft' | 'active' | 'ended';
    }) => updateStoryStatus({ data: { storyId, status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  });

  const { data: characters = [], isLoading: loadingChars } = useQuery({
    queryKey: ['props', 'character'],
    queryFn: () => listProps({ data: { type: 'character' } }),
    enabled: tab === 'library',
  });

  const { data: backgrounds = [], isLoading: loadingBgs } = useQuery({
    queryKey: ['props', 'background'],
    queryFn: () => listProps({ data: { type: 'background' } }),
    enabled: tab === 'library',
  });

  const active = stories.filter((s) => s.status === 'active');
  const draft = stories.filter((s) => s.status === 'draft');
  const ended = stories.filter((s) => s.status === 'ended');

  const handleAddProp = async (type: PropType, file: File, name: string) => {
    try {
      const { signedUrl, publicUrl } = await getSignedUploadUrl({
        data: { filename: file.name, contentType: file.type },
      });

      // Insert into DB first so Drizzle check constraint validates the size.
      const prop = await createProp({
        data: { name, type, imageUrl: publicUrl, size: file.size },
      });

      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        // Rollback the DB entry if the actual file upload fails
        try {
          await deleteProp({ data: { id: prop.id } });
        } catch (e) {
          // Swallow rollback errors to retain original fetch error
        }

        throw new Error(
          `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
        );
      }

      queryClient.invalidateQueries({ queryKey: ['props', type] });
    } catch (error: any) {
      toast.error(
        `File size is too big. It should not be larger than 3MB.\n${error.message}`,
      );
      throw error;
    }
  };

  const handleRemoveProp = async (type: PropType, id: string) => {
    await deleteProp({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ['props', type] });
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Director</h1>
      <p className="text-sm text-base-content/40 mb-6">
        Manage sessions and story status.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-base-300 mb-8">
        {(['dashboard', 'library'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize tracking-wide border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-gold text-base-content'
                : 'border-transparent text-base-content/40 hover:text-base-content/70',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Active', count: active.length, color: 'text-success' },
              {
                label: 'Draft',
                count: draft.length,
                color: 'text-base-content/60',
              },
              {
                label: 'Ended',
                count: ended.length,
                color: 'text-base-content/30',
              },
            ].map(({ label, count, color }) => (
              <div
                key={label}
                className="bg-base-200 border border-base-300 rounded-xl px-5 py-4"
              >
                <p className={cn('text-3xl font-bold font-display', color)}>
                  {count}
                </p>
                <p className="text-xs text-base-content/40 uppercase tracking-widest mt-1">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Stories table */}
          {isLoading ? (
            <p className="text-sm text-base-content/40">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-base-content/50 text-xs uppercase tracking-wider">
                    <th>Story</th>
                    <th>Cast</th>
                    <th>Status</th>
                    <th>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <tr
                      key={story.id}
                      className="hover:bg-base-200 transition-colors"
                    >
                      <td>
                        <Link
                          to="/stories/$storyId"
                          params={{ storyId: story.id }}
                          className="font-medium hover:text-gold transition-colors"
                        >
                          {story.title}
                        </Link>
                      </td>
                      <td className="text-base-content/50">
                        {story.castCount}
                      </td>
                      <td>
                        <StatusBadge status={story.status} />
                      </td>
                      <td>
                        <SessionControls
                          story={story}
                          onSetStatus={(id, status) =>
                            statusMutation.mutate({ storyId: id, status })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'library' && (
        <>
          <p className="text-sm text-base-content/40 mb-6">
            Upload characters and backgrounds available across stories.
          </p>
          <div className="flex flex-col gap-8">
            <LibrarySection
              label="Characters"
              type="character"
              items={characters}
              isLoading={loadingChars}
              onAdd={(file, name) => handleAddProp('character', file, name)}
              onRemove={(id) => handleRemoveProp('character', id)}
            />
            <LibrarySection
              label="Backgrounds"
              type="background"
              items={backgrounds}
              isLoading={loadingBgs}
              onAdd={(file, name) => handleAddProp('background', file, name)}
              onRemove={(id) => handleRemoveProp('background', id)}
            />
          </div>
        </>
      )}
    </div>
  );
}

function SessionControls({
  story,
  onSetStatus,
}: {
  story: { id: string; status: 'draft' | 'active' | 'ended' };
  onSetStatus: (id: string, status: 'draft' | 'active' | 'ended') => void;
}) {
  if (story.status === 'draft') {
    return (
      <button
        onClick={() => onSetStatus(story.id, 'active')}
        className="btn btn-xs btn-success font-display tracking-wide"
      >
        Start session
      </button>
    );
  }
  if (story.status === 'active') {
    return (
      <button
        onClick={() => onSetStatus(story.id, 'ended')}
        className="btn btn-xs btn-error btn-outline font-display tracking-wide"
      >
        End session
      </button>
    );
  }
  return (
    <button
      onClick={() => onSetStatus(story.id, 'draft')}
      className="btn btn-xs btn-outline font-display tracking-wide"
    >
      Set to draft
    </button>
  );
}
