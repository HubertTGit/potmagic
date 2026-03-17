import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listStories } from '@/lib/stories.fns';
import { uploadProp, listProps, deleteProp } from '@/lib/props.fns';
import {
  listInvitedActors,
  addInvitedActor,
  removeInvitedActor,
} from '@/lib/actor-auth.fns';
import { StatusBadge } from '@/components/status-badge.component';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import { LibrarySection } from '@/components/library-section.component';
import { updateStoryStatus } from '@/lib/story-detail.fns';
import type { PropType } from '@/db/schema';
import { toast } from '@/lib/toast';

export const Route = createFileRoute('/_app/director')({
  component: DirectorPage,
});

type Tab = 'dashboard' | 'library' | 'actors';

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

  const { data: sounds = [], isLoading: loadingSounds } = useQuery({
    queryKey: ['props', 'sound'],
    queryFn: () => listProps({ data: { type: 'sound' } }),
    enabled: tab === 'library',
  });

  const { data: invitedActors = [], isLoading: loadingActors } = useQuery({
    queryKey: ['invitedActors'],
    queryFn: () => listInvitedActors(),
    enabled: tab === 'actors',
  });

  const addActorMutation = useMutation({
    mutationFn: (email: string) => addInvitedActor({ data: { email } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['invitedActors'] }),
    onError: (err: any) =>
      toast.error(err?.message ?? 'Failed to invite actor'),
  });

  const removeActorMutation = useMutation({
    mutationFn: (id: string) => removeInvitedActor({ data: { id } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['invitedActors'] }),
  });

  const active = stories.filter((s) => s.status === 'active');
  const draft = stories.filter((s) => s.status === 'draft');
  const ended = stories.filter((s) => s.status === 'ended');

  const handleAddProp = async (type: PropType, file: File, name: string) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const CHUNK = 8192;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const base64 = btoa(binary);

      await uploadProp({
        data: {
          name,
          type,
          fileName: file.name,
          contentType: file.type,
          base64,
          size: file.size,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['props', type] });
    } catch (error: any) {
      toast.error(error.message ?? 'Upload failed');
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
      <div role="tablist" className="flex border-b border-base-300 mb-8">
        {(['dashboard', 'library', 'actors'] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm capitalize -mb-px border-b-2 transition-colors',
              tab === t
                ? 'border-primary font-semibold text-base-content'
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
                          className="font-medium hover:text-primary transition-colors"
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
            Upload characters, backgrounds, and sounds available across stories.
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
            <LibrarySection
              label="Sounds"
              type="sound"
              items={sounds}
              isLoading={loadingSounds}
              onAdd={(file, name) => handleAddProp('sound', file, name)}
              onRemove={(id) => handleRemoveProp('sound', id)}
            />
            {/* Animations section hidden until feature is ready */}
            {/* <LibrarySection
              label="Animations"
              type="animation"
              items={animations}
              isLoading={loadingAnims}
              onAdd={(file, name) => handleAddProp('animation', file, name)}
              onRemove={(id) => handleRemoveProp('animation', id)}
            /> */}
          </div>
        </>
      )}

      {tab === 'actors' && (
        <ActorsTab
          actors={invitedActors}
          isLoading={loadingActors}
          onInvite={(email) => addActorMutation.mutate(email)}
          onRemove={(id) => removeActorMutation.mutate(id)}
          isInviting={addActorMutation.isPending}
        />
      )}
    </div>
  );
}

function ActorsTab({
  actors,
  isLoading,
  onInvite,
  onRemove,
  isInviting,
}: {
  actors: { id: string; email: string; accepted: boolean; createdAt: Date }[];
  isLoading: boolean;
  onInvite: (email: string) => void;
  onRemove: (id: string) => void;
  isInviting: boolean;
}) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!email.trim()) return;
    onInvite(email.trim());
    setEmail('');
  };

  return (
    <div>
      <p className="text-sm text-base-content/40 mb-6">
        Invite actors by email. They can log in once invited.
      </p>

      {/* Invite form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="actor@example.com"
          required
          className="input flex-1 bg-base-200 border-base-300 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
        />
        <button
          type="submit"
          disabled={isInviting || !email.trim()}
          className={cn(
            'btn btn-primary font-display tracking-[0.05em]',
            (isInviting || !email.trim()) && 'opacity-50',
          )}
        >
          {isInviting ? 'Inviting…' : 'Invite'}
        </button>
      </form>

      {/* Actors list */}
      {isLoading ? (
        <p className="text-sm text-base-content/40">Loading…</p>
      ) : actors.length === 0 ? (
        <p className="text-sm text-base-content/30 text-center py-8">
          No actors invited yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="text-base-content/50 text-xs uppercase tracking-wider">
                <th>Email</th>
                <th>Status</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {actors.map((actor) => (
                <tr
                  key={actor.id}
                  className="hover:bg-base-200 transition-colors"
                >
                  <td className="font-medium">{actor.email}</td>
                  <td>
                    <span
                      className={cn(
                        'text-xs font-medium uppercase tracking-wider',
                        actor.accepted
                          ? 'text-success'
                          : 'text-base-content/40',
                      )}
                    >
                      {actor.accepted ? 'Accepted' : 'Pending'}
                    </span>
                  </td>
                  <td className="text-base-content/40 text-xs">
                    {new Date(actor.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => onRemove(actor.id)}
                      className="btn btn-ghost btn-xs text-base-content/40 hover:text-error"
                    >
                      <X className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
