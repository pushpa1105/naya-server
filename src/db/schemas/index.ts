/**
 * On schema update, generate migration file & run it migrate to db.
 * Step 1: `npx drizzle-kit generate --name <migration-name>`
 * Step 2: `npx drizzle-kit migrate`
 */

import { tags } from './tags';
import { users } from './user';

export const databaseSchema = {
  users,
  tags,
};

export { tags, users };
