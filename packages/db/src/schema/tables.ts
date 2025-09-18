// Drizzle ORM 用のテーブル定義集約
// - Web/BFF/ジョブで共用するテーブルをここで定義する

import { boolean, index, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// subjects
export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull().unique(),
});

// topics
export const topics = pgTable('topics', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
}, (t) => ({
  uq: sql`UNIQUE (${t.subjectId.name}, ${t.name.name})`,
}));

// tags
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
}, (t) => ({
  uq: sql`UNIQUE (${t.subjectId.name}, ${t.name.name})`,
}));

// chats
export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
  title: text('title').notNull().default('新しいチャット'),
  status: text('status').notNull().default('in_progress'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  statusCk: sql`CHECK (${t.status.name} IN ('in_progress','ended'))`,
}));

// messages
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  roleCk: sql`CHECK (${t.role.name} IN ('user','assistant','system'))`,
}));

// chat_tags
export const chatTags = pgTable('chat_tags', {
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'restrict' }),
  assignedBy: text('assigned_by').notNull().default('ai'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.chatId, t.tagId] }),
  assignedByCk: sql`CHECK (${t.assignedBy.name} IN ('ai','user','system'))`,
}));

// user_settings
export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  timezone: text('timezone').notNull().default('Asia/Tokyo'),
  level: text('level').notNull().default('normal'),
  theme: text('theme').notNull().default('system'),
});

// user_subject_prefs
export const userSubjectPrefs = pgTable('user_subject_prefs', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull().default(true),
  level: text('level'),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.subjectId] }),
}));

// push_tokens
export const pushTokens = pgTable('push_tokens', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  platform: text('platform').notNull(),
  deviceId: text('device_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.token] }),
  platformCk: sql`CHECK (${t.platform.name} IN ('ios','android'))`,
  tokenUq: sql`UNIQUE (${t.token.name})`,
}));

// devices
export const devices = pgTable('devices', {
  id: text('device_id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  model: text('model'),
  osVersion: text('os_version'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// iap_receipts
export const iapReceipts = pgTable('iap_receipts', {
  receiptId: text('receipt_id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  platform: text('platform').notNull(),
  productId: text('product_id').notNull(),
  status: text('status').notNull(),
  purchaseAt: timestamp('purchase_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  rawPayloadHash: text('raw_payload_hash'),
  rawPayload: jsonb('raw_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  platformCk: sql`CHECK (${t.platform.name} IN ('ios','android'))`,
  statusCk: sql`CHECK (${t.status.name} IN ('trial','active','grace','paused','canceled','expired'))`,
}));

// refresh_tokens
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  rotatedAt: timestamp('rotated_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (t) => ({
  userDeviceIdx: index('refresh_tokens_user_device_idx').on(t.userId, t.deviceId),
}));
