/**
 * People Registry Types
 *
 * Type definitions for the People Registry extension.
 */

/**
 * Person record stored in the database
 */
export interface Person {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Normalized name for searching (lowercase, trimmed) */
  normalizedName: string
  /** Optional description or notes about the person */
  description?: string
  /** Additional metadata as JSON */
  metadata?: PersonMetadata
  /** ISO timestamp when created */
  createdAt: string
  /** ISO timestamp when last updated */
  updatedAt: string
}

/**
 * Additional metadata that can be stored about a person
 */
export interface PersonMetadata {
  /** Relationship to the user (e.g., "friend", "colleague", "family") */
  relationship?: string
  /** Email address */
  email?: string
  /** Phone number */
  phone?: string
  /** Birthday (ISO date string) */
  birthday?: string
  /** Workplace or company */
  workplace?: string
  /** Any other custom fields */
  [key: string]: unknown
}

// Note: Database record types (PersonRecord, NewPersonRecord) are inferred
// from the Drizzle schema in ./db/schema.ts

/**
 * Input for creating or updating a person
 */
export interface PersonInput {
  /** Name (required for create) */
  name?: string
  /** Description or notes */
  description?: string
  /** Additional metadata */
  metadata?: PersonMetadata
}

/**
 * Search/filter options for listing people
 */
export interface ListPeopleOptions {
  /** Search query (matches name) */
  query?: string
  /** Maximum number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
}
