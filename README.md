# PotMagic

An online collaborative theater platform for storytelling. Groups perform interactive stories together using animated canvas characters, with a public live broadcast stream for audiences.

See [SPEC.md](./SPEC.md) for full product specification.

## Features

- **Interactive canvas stage** — drag, rotate, and mirror characters using Konva
- **Real-time collaboration** — actors perform together via LiveKit multi-user sessions
- **Public broadcast** — audiences watch a live stream at a unique URL, no login required
- **Role-based access** — Directors manage stories and cast; Actors perform; Viewers watch
- **Dark/light mode** — persisted theme preference

## Tech Stack

| Concern | Technology |
| --- | --- |
| Frontend | React 19 + TypeScript |
| Routing | TanStack Router |
| Canvas | Konva + react-konva |
| Styling | Tailwind CSS v4 + Sass |
| Auth | better-auth (email/password) |
| Real-time | LiveKit |
| Database | SQLite |
| Build | Vite 7 |

## Getting Started

```bash
pnpm install
pnpm dev
```

## Commands

```bash
pnpm dev        # Start development server
pnpm build      # TypeScript check + production build
pnpm lint       # Run ESLint
pnpm preview    # Preview production build
```

## Project Status

| Area | Status |
| --- | --- |
| Konva canvas (drag, rotate, mirror) | Done |
| TanStack Router + routes | Done |
| better-auth config (email/password) | Done |
| LiveKit dependencies | Installed |
| Hono backend server | Not started |
| SQLite database + schema | Not started |
| Authentication UI | Not started |
| LiveKit integration | Not started |
| Director dashboard | Not started |
| Public broadcast page | Not started |
