// Typed mock data matching Drizzle schema shapes (UI-only, no DB)

export type StoryStatus = 'draft' | 'active' | 'ended'
export type PropType = 'background' | 'character'
export type UserRole = 'actor' | 'director'

export interface MockUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface MockProp {
  id: string
  storyId: string
  name: string
  type: PropType
  imageUrl: string | null
}

export interface MockCast {
  id: string
  storyId: string
  userId: string
  propId: string
  name: string
  imageUrl: string | null
  user: MockUser
  prop: MockProp
}

export interface MockScene {
  id: string
  storyId: string
  title: string
  order: number
}

export interface MockStory {
  id: string
  title: string
  directorId: string
  status: StoryStatus
  scenes: MockScene[]
  cast: MockCast[]
  props: MockProp[]
}

export const MOCK_USERS: MockUser[] = [
  { id: 'u1', name: 'Hubert', email: 'hubert@example.com', role: 'director' },
  { id: 'u2', name: 'Anna', email: 'anna@example.com', role: 'actor' },
  { id: 'u3', name: 'Marco', email: 'marco@example.com', role: 'actor' },
]

export const MOCK_STORIES: MockStory[] = [
  {
    id: 's1',
    title: 'The Haunted Ballroom',
    directorId: 'u1',
    status: 'active',
    props: [
      { id: 'p1', storyId: 's1', name: 'Castle Hall', type: 'background', imageUrl: null },
      { id: 'p2', storyId: 's1', name: 'Bear', type: 'character', imageUrl: null },
      { id: 'p3', storyId: 's1', name: 'Croc', type: 'character', imageUrl: null },
    ],
    cast: [
      {
        id: 'c1', storyId: 's1', userId: 'u2', propId: 'p2', name: 'Anna as Bear', imageUrl: null,
        user: { id: 'u2', name: 'Anna', email: 'anna@example.com', role: 'actor' },
        prop: { id: 'p2', storyId: 's1', name: 'Bear', type: 'character', imageUrl: null },
      },
      {
        id: 'c2', storyId: 's1', userId: 'u3', propId: 'p3', name: 'Marco as Croc', imageUrl: null,
        user: { id: 'u3', name: 'Marco', email: 'marco@example.com', role: 'actor' },
        prop: { id: 'p3', storyId: 's1', name: 'Croc', type: 'character', imageUrl: null },
      },
    ],
    scenes: [
      { id: 'sc1', storyId: 's1', title: 'Opening Night', order: 1 },
      { id: 'sc2', storyId: 's1', title: 'The Twist', order: 2 },
      { id: 'sc3', storyId: 's1', title: 'Finale', order: 3 },
    ],
  },
  {
    id: 's2',
    title: 'Mystery at Sea',
    directorId: 'u1',
    status: 'draft',
    props: [
      { id: 'p4', storyId: 's2', name: 'Ocean Deck', type: 'background', imageUrl: null },
      { id: 'p5', storyId: 's2', name: 'Captain', type: 'character', imageUrl: null },
    ],
    cast: [
      {
        id: 'c3', storyId: 's2', userId: 'u2', propId: 'p5', name: 'Anna as Captain', imageUrl: null,
        user: { id: 'u2', name: 'Anna', email: 'anna@example.com', role: 'actor' },
        prop: { id: 'p5', storyId: 's2', name: 'Captain', type: 'character', imageUrl: null },
      },
    ],
    scenes: [
      { id: 'sc4', storyId: 's2', title: 'Departure', order: 1 },
    ],
  },
  {
    id: 's3',
    title: 'Forest Dreams',
    directorId: 'u1',
    status: 'ended',
    props: [],
    cast: [],
    scenes: [],
  },
]

export function getStory(id: string): MockStory | undefined {
  return MOCK_STORIES.find((s) => s.id === id)
}

export function getScene(storyId: string, sceneId: string) {
  return MOCK_STORIES.find((s) => s.id === storyId)?.scenes.find((sc) => sc.id === sceneId)
}
