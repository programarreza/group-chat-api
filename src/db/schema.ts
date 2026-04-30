import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  username: varchar('username', { length: 24 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rooms = pgTable('rooms', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 32 }).notNull().unique(),
  createdBy: varchar('created_by', { length: 24 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: varchar('id', { length: 50 }).primaryKey(),
  roomId: varchar('room_id', { length: 50 }).notNull(),
  username: varchar('username', { length: 24 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
