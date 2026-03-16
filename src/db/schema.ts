import { pgTable, pgEnum, text, timestamp, boolean, integer, real, index, unique, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const roleEnum = pgEnum('role', ['actor', 'director'])
export const storyStatusEnum = pgEnum('story_status', ['draft', 'active', 'ended'])
export const propTypeEnum = pgEnum('prop_type', ['background', 'character', 'animation'])
export type PropType = 'character' | 'background' | 'animation';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: roleEnum('role').default('actor').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
)

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('accounts_user_id_idx').on(table.userId)],
)

export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
)

export const stories = pgTable(
  'stories',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    directorId: text('director_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: storyStatusEnum('status').default('draft').notNull(),
    broadcastAt: timestamp('broadcast_at'),
    livekitRoomName: text('livekit_room_name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('stories_director_id_idx').on(table.directorId)],
)

export const scenes = pgTable(
  'scenes',
  {
    id: text('id').primaryKey(),
    storyId: text('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    order: integer('order').default(0).notNull(),
    backgroundId: text('background_id').references(() => props.id, { onDelete: 'set null' }),
    backgroundPosX: real('background_pos_x'),
    backgroundPosY: real('background_pos_y'),
    backgroundRotation: real('background_rotation'),
    backgroundScaleX: real('background_scale_x'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('scenes_story_id_idx').on(table.storyId)],
)

export const props = pgTable(
  'props',
  {
    id: text('id').primaryKey(),
    storyId: text('story_id')
      .references(() => stories.id, { onDelete: 'set null' }),
    createdBy: text('created_by')
      .references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    type: propTypeEnum('type').notNull(),
    imageUrl: text('image_url'),
    size: integer('size'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('props_story_id_idx').on(table.storyId),
    check('props_size_limit', sql`${table.size} <= 1048576`),
  ],
)

// Each actor can be assigned to multiple stories, but only once per story
export const cast = pgTable(
  'cast',
  {
    id: text('id').primaryKey(),
    storyId: text('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('cast_story_id_idx').on(table.storyId),
    unique('cast_user_story_unique').on(table.userId, table.storyId),
  ],
)

export const invitedActors = pgTable('invited_actors', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  addedBy: text('added_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const sceneCast = pgTable(
  'scene_cast',
  {
    id: text('id').primaryKey(),
    sceneId: text('scene_id')
      .notNull()
      .references(() => scenes.id, { onDelete: 'cascade' }),
    castId: text('cast_id')
      .notNull()
      .references(() => cast.id, { onDelete: 'cascade' }),
    propId: text('prop_id')
      .references(() => props.id, { onDelete: 'set null' }),
    posX: real('pos_x'),
    posY: real('pos_y'),
    rotation: real('rotation'),
    scaleX: real('scale_x'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('scene_cast_scene_id_idx').on(table.sceneId),
    unique('scene_cast_unique').on(table.sceneId, table.castId),
  ],
)
