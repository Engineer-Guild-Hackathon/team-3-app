// プロトタイプ用スキーマ定義（Drizzle ORM, PostgreSQL）
// 仕様: docs/db-prototype-spec.md 準拠

import { pgTable, uuid, text, timestamp, primaryKey, boolean } from 'drizzle-orm/pg-core';
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

// topics（任意）
export const topics = pgTable('topics', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
}, (t) => ({
  uq: sql`UNIQUE (${t.subjectId.name}, ${t.name.name})`,
}));

// tags（簡易: tag_type なし）
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
}, (t) => ({
  uq: sql`UNIQUE (${t.subjectId.name}, ${t.name.name})`,
}));

// chats（簡易）
export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  // topic_id は任意（subject_id と論理的に関連、DB制約は topic -> topics.id の FK のみ）
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
  title: text('title').notNull().default('新しいチャット'),
  status: text('status').notNull().default('in_progress'), // chat_status: in_progress | ended
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // CHECK: status
  statusCk: sql`CHECK (${t.status.name} IN ('in_progress','ended'))`,
}));

// messages
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // message_role: user | assistant | system
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  roleCk: sql`CHECK (${t.role.name} IN ('user','assistant','system'))`,
}));

// chat_tags（confidence なし）
export const chatTags = pgTable('chat_tags', {
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'restrict' }),
  assignedBy: text('assigned_by').notNull().default('ai'), // tag_assigned_by: ai | user | system
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.chatId, t.tagId] }),
  assignedByCk: sql`CHECK (${t.assignedBy.name} IN ('ai','user','system'))`,
}));

// user_settings（通知系は除外）
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

// 備考:
// - Drizzle の CHECK 制約は table builder で sql を使って付与
// - VIEW (user_tag_mastery_v) はマイグレーションSQLで作成する運用を想定
