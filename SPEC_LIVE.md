# SPEC_LIVE — Live Collaboration

Specifies real-time multi-user voice and data collaboration for honeypotmagic, built on LiveKit (WebRTC + SFU).

---

## Overview

When actors and directors enter the `/stage/*` route, they automatically join a private LiveKit session for that story. They can communicate via voice and see each other's prop movements in real time. When the director changes the story status to `active`, the session is publicly broadcast via the `/public` route, which viewers access by entering the story's ID from the login page.

---

## Glossary

| Term | Meaning |
|------|---------|
| Room | A LiveKit room. One room per story, named by `storyId`. |
| Session | The collaborative experience within a room. |
| Practice mode | When story status is `draft` — private, not broadcast. |
| Performance mode | When story status is `active` — public broadcast enabled. |
| Viewer | Unauthenticated user watching the public broadcast. |

---

## Session Lifecycle

| Story status | Room state | Actors/Directors | Viewers |
|---|---|---|---|
| `draft` | Open (practice) | Can join — voice + data | No access |
| `active` | Open (live) | Can join — voice + data | Can join — subscribe only |
| `ended` | Closed | Disconnected | Disconnected |

The room is created lazily on first participant join (LiveKit creates rooms automatically on first valid token use — no explicit pre-creation call needed; the room uses LiveKit server defaults for timeout and participant limits). When status changes to `ended`, the room is closed via the LiveKit server API and all participants are disconnected.

---

## LiveKit Room Configuration

- **Room name**: `storyId`
- **Media**: audio only (voice). No video tracks.
- **Data messages**: used for prop position sync.
- **Max participants**: no hard limit defined (director enforces cast size).

---

## Token Generation

### Server Function

**`getLiveKitToken`** — defined in `src/lib/livekit.fns.ts`

Called from the stage route and public route before connecting to the room.

### Actor / Director Token

- Requires authenticated session (`requireAuth()`)
- Actor: must have a `cast` record for the story
- Director: must be the story's `directorId`
- Grants: **publish** (audio) + **subscribe** + **data send/receive**
- Token identity: `userId`
- Token metadata: `{ name, role, castId? }`

### Viewer Token

- No authentication required
- Story must have status `active` — otherwise return 403
- Grants: **subscribe** only (audio) + **data receive**
- Token identity: auto-generated anonymous UUID
- Token expiry: 12 hours

### Environment Variables (required)

```
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

---

## Stage Route Integration (`/stage/$sceneId`)

When an actor or director navigates to any `/stage/*` route, they **automatically join** the story's LiveKit session — there is no separate invite step. "Invited to join" means that entering the route IS joining the session.

Join flow:

1. The `storyId` is resolved from the scene (via `getSceneStage`, which already returns scene data including `storyId`).
2. The TanStack Start route loader calls `getLiveKitToken` server-side and returns the token string in the loader data.
3. The route component reads the token from loader data and passes it to the `RoomProvider` `token` prop.
4. `RoomProvider` (from `@livekit/components-react`) connects to the room and auto-publishes the microphone.
5. On route leave or story status → `ended`, the participant disconnects.

The `RoomProvider` wraps `StageComponent` — voice and data are available to all child components via the LiveKit React context.

---

## Voice (Audio)

- Auto-publish microphone on stage load.
- Audio-only — no video tracks are published.
- All participants (actors + director) can hear each other during both `draft` and `active`.
- Viewers (status: `active`) receive audio as subscribers.
- UI: a mute/unmute toggle button on the stage overlay.
- Connection states: `connecting`, `connected`, `disconnected`, `failed` shown via indicator.

---

## Data Channel — Prop Position Sync

### When a user drags a prop

On every `dragmove` , `rotate` and `dblTap` events in `DraggableCharacter` (for the local user's assigned prop):

1. Publish a data message to the room via `room.localParticipant.publishData()`.
2. Message is broadcast to all other participants.

### Message format (JSON, encoded as UTF-8)

```json
{
  "type": "prop:move",
  "castId": "cast_abc123",
  "x": 320,
  "y": 180,
  "rotation": 20,
  "z-index": 2,
  "scale-x": -1
}
```

### Delivery mode

Use `DataPacket_Kind.LOSSY` (UDP-like, unreliable). Prop position updates are high-frequency and stale messages are worthless — lossy delivery prevents a backlog of queued position messages causing visible lag for recipients. Do NOT use `RELIABLE` (the LiveKit default) for this message type.

### Publish throttle

Throttle publishes to **one message per animation frame** (via `requestAnimationFrame`) or a minimum interval of **30ms**, whichever is less frequent. This prevents saturating the data channel on slow connections while keeping movement visually smooth.

### On receiving a data message

In `DraggableCharacter`, subscribe to `RoomEvent.DataReceived`. When a message with `castId` matching this component's `castId` is received, update the Konva node position imperatively via ref (no React state — consistent with existing performance pattern).

---

## Status-Based Behavior

### `draft` — Practice Mode

- Room is open but private.
- Actors and director can join with publisher tokens.
- Voice channel active between all participants.
- Prop movements visible to all participants via data channel.
- **Viewer tokens are rejected** (403) — public cannot access.
- Canvas state is NOT broadcast publicly.

### `active` — Performance Mode

All of the above, plus:

- Viewer tokens are now issued (subscriber-only).
- Public broadcast accessible at `/public?id={storyId}`.
- Story `broadcastAt` timestamp is set when `updateStoryStatus` changes to `active`.
- The canvas (read-only) and audio are receivable by viewers.

### `ended`

- `updateStoryStatus` server function calls LiveKit API to delete the room.
- All participants (actors, director, viewers) are disconnected.
- Subsequent token requests return 410 Gone.

---

## Public Broadcast Route (`/public`)

This route **replaces** the `/broadcast/:roomId` route planned in the original SPEC.md. That route was never implemented; `/public` supersedes it.

### Route

- Path: `/public` (query param: `?id={storyId}`)
- Auth: none required
- File: `src/routes/public.tsx` (outside `_app` authenticated layout)

### Behavior

1. Read `storyId` from query param.
2. Call `getLiveKitToken` as viewer — if story is not `active`, show "This show is not live" message.
3. Connect to LiveKit room as subscriber.
4. Render a read-only Konva canvas (same scene layout as stage, but non-interactive).
5. Receive data messages to animate prop positions in real time.
6. Receive audio from all publishers.

### Canvas in Public View

- Renders `StageComponent` with all props non-draggable (`draggable={false}`).
- Prop positions updated via data channel messages (imperative Konva ref updates).
- No user controls (no drag, no flip, no rotate).
- Displays the scene that was active when the viewer joined; future: scene switching via data message.

---

## Login Page Changes (`/login`)

Add a third tab "Watch" to the existing multi-tab login UI (alongside "Sign In" and "Register").

### Watch tab

- Input: "Show ID" text field
- Button: "Watch"
- On submit:
  1. Call `validatePublicShow(storyId)` server function.
  2. If valid (story exists + status `active`): redirect to `/public?id={storyId}`.
  3. If not found: show "Show not found" error.
  4. If found but status `draft`: show "This show is not currently live — it may still be in rehearsal" error.
  5. If found but status `ended`: show "This show has ended" error.

### `validatePublicShow` server function

Defined in `src/lib/livekit.fns.ts`. Returns `{ valid: boolean; reason?: string }`. No auth required.

---

## Online Presence (CastPreview Enhancement)

The existing `CastPreview` component (top-right overlay on stage) is enhanced to show:

- Which cast members are currently **connected** to the LiveKit room (gold ring = connected; grey ring = offline).
- Microphone mute state (small icon overlay on avatar).

Uses `useParticipants()` from `@livekit/components-react`, matching participant `identity` (= `userId`) to cast members.

---

## New Files

| File | Purpose |
|------|---------|
| `src/lib/livekit.fns.ts` | `getLiveKitToken`, `validatePublicShow`, `closeLiveKitRoom` server functions |
| `src/routes/public.tsx` | Public viewer broadcast route |
| `src/components/voice-controls.component.tsx` | Mute/unmute button + connection state indicator |
| `src/hooks/useLiveKitRoom.ts` | Hook: connect to room, expose room instance + connection state |

---

## Modified Files

| File | Change |
|------|--------|
| `src/routes/_app/stage/$sceneId.tsx` | Fetch token server-side, wrap with `RoomProvider`, pass storyId down |
| `src/components/stage.component.tsx` | Include `VoiceControls` overlay |
| `src/components/draggable-character.component.tsx` | Publish `prop:move` on dragmove; subscribe to `DataReceived` for remote updates |
| `src/components/cast-preview.component.tsx` | Show online/offline + mute state via LiveKit participant list |
| `src/lib/story-detail.fns.ts` | `updateStoryStatus`: set `broadcastAt` on `active`; call `closeLiveKitRoom` on `ended` |
| `src/routes/login.tsx` | Add "Watch" tab with show ID input and validation |
| `src/db/schema.ts` | No changes needed — `livekitRoomName` and `broadcastAt` fields already exist |

---

## Error States

| Scenario | Behavior |
|----------|---------|
| Microphone permission denied | Toast error; stage remains usable (local-only, no voice) |
| LiveKit connection failed | Toast error + retry button; stage remains usable in local-only mode |
| Story status changes to `ended` while connected | "Show has ended" overlay shown; participant disconnected |
| Viewer tries to access a `draft` story | "This show is not currently live — it may still be in rehearsal" message on `/public` |
| Viewer tries to access an `ended` story | "This show has ended" message on `/public` |
| Invalid storyId on `/public` | "Show not found" message |
| Actor without a cast record tries to get a token | 403 — "You are not in the cast for this story" |

---

## Out of Scope

- Video tracks
- Screen sharing
- Chat / text messages
- Recording or archiving
- Rotation and scaleX sync via data channel (position only for now)
- Multi-scene switching for viewers (viewers see state of room at join time)
- Viewer count display
