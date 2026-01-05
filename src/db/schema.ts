/**
 * Database Schema
 *
 * Typed schema for the People Registry extension using Drizzle ORM.
 * Table names are prefixed with ext_people_registry_ to avoid conflicts.
 */

import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { PersonMetadata } from '../types.js'

/**
 * People table
 * Stores information about people mentioned in conversations
 */
export const persons = sqliteTable(
  'ext_people_registry_persons',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    description: text('description'),
    metadata: text('metadata', { mode: 'json' }).$type<PersonMetadata>(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('ext_people_registry_persons_normalized_name_idx').on(table.normalizedName),
  ]
)

/**
 * Schema export
 */
export const peopleSchema = {
  persons,
}

/**
 * Type inference from schema
 */
export type PersonRecord = typeof persons.$inferSelect
export type NewPersonRecord = typeof persons.$inferInsert
