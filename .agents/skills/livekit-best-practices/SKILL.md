---
name: livekit-best-practices
description: Use when building multi-user realtime features with LiveKit — rooms, sessions, video, voice, data exchange, token auth, and participant management.
---

# LiveKit Best Practices

Apply these patterns when building any LiveKit-powered feature: multi-user video calls, voice sessions, data channels, or broadcast streams.

---

## 1. Core Concepts

| Concept | Description |
|---------|-------------|
| **Room** | Container for a session. Auto-created on first join, auto-closed when empty. |
| **Participant** | Anyone in a room: user, agent, device, or backend process. |
| **Track** | A media stream (audio, video, screen share) published by a participant. |
| **TrackPublication** | Metadata about a track; always available even when not subscribed. |
| **Data channel** | Realtime messaging between participants via text streams, byte streams, RPC, or packets. |

Rooms are identified by **name** (any unique string). Participants are identified by **identity** (unique per room).

---

## 2. Token Generation (Server-Side)

Tokens are JWT-signed with your API key/secret. **Never generate tokens on the client.**

```typescript
// Node.js — livekit-server-sdk
import { AccessToken } from 'livekit-server-sdk'

export async function createToken(roomName: string, participantIdentity: string) {
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: participantIdentity,
  })
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })
  return at.toJwt()
}
```

### Key grant fields
| Grant | Purpose |
|-------|---------|
| `roomJoin: true` | Allow joining the room |
| `canPublish: false` | Subscribe-only (viewer/broadcast) |
| `canPublishSources: ['camera']` | Restrict to specific sources |
| `roomAdmin: true` | Moderation permissions |
| `hidden: true` | Invisible participant (recording bot) |

Tokens expire after 1 hour by default (only affects initial connection — reconnects use server-refreshed tokens).

---

## 3. Room Management (Backend)

```typescript
import { RoomServiceClient } from 'livekit-server-sdk'

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET,
)

// Create a room with options
await roomService.createRoom({
  name: 'my-room',
  emptyTimeout: 10 * 60,   // close after 10 min empty
  maxParticipants: 50,
})

// List active rooms
const rooms = await roomService.listRooms()

// End a session — disconnects all participants
await roomService.deleteRoom('my-room')
```

**Multi-session pattern**: use unique room names per session (`story-${storyId}`, `session-${Date.now()}`). Rooms auto-close when empty — no manual cleanup needed in most cases.

---

## 4. Connecting (Client SDK)

```typescript
import { Room } from 'livekit-client'

const room = new Room({
  adaptiveStream: true,   // auto-adjust video quality to UI size
  dynacast: true,         // only send simulcast layers that are subscribed
})

// Listen to events BEFORE connecting
room.on(RoomEvent.ParticipantConnected, (participant) => { /* ... */ })
room.on(RoomEvent.ParticipantDisconnected, (participant) => { /* ... */ })
room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => { /* render */ })
room.on(RoomEvent.Disconnected, (reason) => { /* handle disconnect */ })

await room.connect(wsUrl, token)

// Access participants
const local = room.localParticipant
const remotes = room.remoteParticipants // Map<identity, RemoteParticipant>

// Disconnect cleanly
await room.disconnect()
```

### React (component library)
```tsx
import { LiveKitRoom, VideoConference } from '@livekit/components-react'

<LiveKitRoom serverUrl={wsUrl} token={token} connect={true}>
  <VideoConference />
</LiveKitRoom>
```

---

## 5. Publishing Video & Audio

```typescript
// Enable camera and microphone (handles permissions automatically)
await room.localParticipant.setCameraEnabled(true)
await room.localParticipant.setMicrophoneEnabled(true)

// Mute/unmute without unpublishing
await room.localParticipant.setCameraEnabled(false) // mutes, notifies others

// Restrict who can subscribe to your tracks
room.localParticipant.setTrackSubscriptionPermissions(false, [
  { participantIdentity: 'trusted-user', allowAll: true },
])
```

### Multi-user video session
```typescript
// Each participant publishes their own camera/mic
// Subscribers receive all tracks by default (autoSubscribe: true)
// Use adaptive stream to auto-match quality to rendered size

room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
  const el = track.attach()          // creates <video> or <audio> element
  container.appendChild(el)
})

room.on(RoomEvent.TrackUnsubscribed, (track) => {
  track.detach()                     // removes from DOM
})

// Active speaker detection
room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
  highlightSpeakers(speakers)
})
```

### Selective subscription (large rooms / broadcast)
```typescript
const room = new Room()
await room.connect(wsUrl, token, { autoSubscribe: false })

room.on(RoomEvent.TrackPublished, (pub, participant) => {
  if (shouldSubscribe(participant)) pub.setSubscribed(true)
})
```

---

## 6. Data Exchange

### Text streams (chat, LLM output)
```typescript
// Send to entire room
await room.localParticipant.sendText('Hello everyone', { topic: 'chat' })

// Stream incrementally (e.g. LLM token-by-token)
const writer = await room.localParticipant.streamText({ topic: 'llm-response' })
for (const chunk of chunks) await writer.write(chunk)
await writer.close()

// Receive
room.registerTextStreamHandler('chat', async (reader, participantInfo) => {
  const text = await reader.readAll()
  // or iterate: for await (const chunk of reader) { ... }
})
```

### Data packets (high-frequency / low-latency)
```typescript
const encoder = new TextEncoder()
const data = encoder.encode(JSON.stringify({ x: 100, y: 200 }))

// Lossy = fast, no guarantee (use for position updates, game state)
room.localParticipant.publishData(data, { reliable: false })

// Reliable = ordered delivery (use for chat, commands)
room.localParticipant.publishData(data, {
  reliable: true,
  destinationIdentities: ['player-2'], // omit to broadcast to all
  topic: 'position',
})

room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
  const msg = JSON.parse(new TextDecoder().decode(payload))
})
```

### Data API comparison
| API | Use when |
|-----|----------|
| `sendText` / `streamText` | Chat, streamed text, LLM output — no size limit |
| Byte streams | File transfer, binary data, images |
| RPC | Request/response — tool calls, state queries |
| Data packets | High-frequency updates (position, cursor); lossy for speed |

---

## 7. Multi-User Multi-Session Architecture

```
User A ──┐
User B ──┤ → Room "story-123" → LiveKit SFU → All subscribers
User C ──┘

Viewer 1 ──┐ subscribe-only token
Viewer 2 ──┤ → same room, canPublish: false
Viewer 3 ──┘
```

**Pattern: separate rooms per session**
- One room = one live session (story, call, meeting)
- Room name = stable session ID (`story-${id}`, `room-${uuid}`)
- Use `emptyTimeout` to auto-close idle rooms
- Generate a **new token per participant per room** — never reuse tokens

**Pattern: roles via token grants**
```typescript
// Director / host token
{ roomJoin: true, canPublish: true, roomAdmin: true }

// Actor / participant token
{ roomJoin: true, canPublish: true, canSubscribe: true }

// Viewer / audience token
{ roomJoin: true, canPublish: false, canPublishData: false, canSubscribe: true }

// Recording bot token (invisible)
{ roomJoin: true, hidden: true, canSubscribe: true }
```

---

## 8. Events Reference

```typescript
// Room lifecycle
RoomEvent.Connected              // room.connect() resolved
RoomEvent.Disconnected           // reason: ROOM_DELETED, DUPLICATE_IDENTITY, etc.
RoomEvent.Reconnecting           // auto-reconnect in progress
RoomEvent.Reconnected            // recovered

// Participant events
RoomEvent.ParticipantConnected
RoomEvent.ParticipantDisconnected
RoomEvent.ParticipantMetadataChanged

// Track events
RoomEvent.TrackPublished         // participant published a track
RoomEvent.TrackSubscribed        // local client subscribed → ready to render
RoomEvent.TrackUnpublished
RoomEvent.TrackUnsubscribed
RoomEvent.TrackMuted
RoomEvent.TrackUnmuted

// Audio / speaking
RoomEvent.ActiveSpeakersChanged  // [Participant[]] currently speaking
RoomEvent.IsSpeakingChanged      // on individual participant

// Data
RoomEvent.DataReceived           // (payload, participant, kind, topic)
```

---

## 9. Common Mistakes

| Mistake | Fix |
|---------|-----|
| Generating tokens on the client | Always server-side — never expose API secret |
| Using same identity for two participants | Identity must be unique per room |
| Not attaching `track.detach()` on unsubscribe | Memory/DOM leak — always detach on `TrackUnsubscribed` |
| Publishing data before room is connected | Wait for `RoomEvent.Connected` or after `await room.connect()` |
| Reliable packets > 15KiB | Chunk large data or use byte streams instead |
| Lossy packets > 1300 bytes | Fragmented UDP = effectively lost; keep lossy packets tiny |
| Hard-coding room names | Use session-scoped IDs to prevent cross-session leaks |
| Not handling `Disconnected` event | Show reconnecting UI; do not assume reconnect succeeds |
| Using `room.disconnect()` in cleanup without guard | Check `room.state` is not already `disconnected` |
