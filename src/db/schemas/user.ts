import { sql } from 'drizzle-orm';
import { pgTable, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  email: text('email').unique().notNull(),
  name: text('name'),
  password: text('password'),
  refreshToken: text('refresh_token'),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`now()`),
});
