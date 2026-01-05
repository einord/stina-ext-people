/**
 * People Repository
 *
 * CRUD operations for the People Registry using Drizzle ORM for type safety.
 */

import { persons, type PersonRecord, type NewPersonRecord } from './schema.js'
import type { Person, PersonInput, ListPeopleOptions } from '../types.js'

/**
 * Database API interface (from ExtensionContext)
 */
interface DatabaseAPI {
  execute<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>
}

/**
 * Generate a unique ID for a new person
 */
function generateId(): string {
  return `person_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Normalize a name for searching
 */
function normalizeName(name: string): string {
  return name.toLowerCase().trim()
}

/**
 * Convert a database record to a Person object
 */
function recordToPerson(record: PersonRecord): Person {
  return {
    id: record.id,
    name: record.name,
    normalizedName: record.normalizedName,
    description: record.description ?? undefined,
    metadata: record.metadata ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

/**
 * People Repository class
 */
export class PeopleRepository {
  private db: DatabaseAPI
  private initialized = false

  constructor(db: DatabaseAPI) {
    this.db = db
  }

  /**
   * Initialize the database schema
   *
   * Note: We use raw SQL here because extensions communicate with the host
   * via message passing. The Drizzle schema provides type safety for records,
   * but query execution goes through the extension API's execute() method.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    await this.db.execute(
      `CREATE TABLE IF NOT EXISTS ext_people_registry_persons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        description TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    )

    await this.db.execute(
      `CREATE INDEX IF NOT EXISTS ext_people_registry_persons_normalized_name_idx
       ON ext_people_registry_persons(normalized_name)`
    )

    this.initialized = true
  }

  /**
   * List people with optional filtering
   */
  async list(options: ListPeopleOptions = {}): Promise<Person[]> {
    await this.initialize()

    const { query, limit = 50, offset = 0 } = options

    let sqlStr: string
    let params: unknown[]

    if (query) {
      const normalizedQuery = normalizeName(query)
      sqlStr = `
        SELECT id, name, normalized_name, description, metadata, created_at, updated_at
        FROM ext_people_registry_persons
        WHERE normalized_name LIKE ?
        ORDER BY name ASC
        LIMIT ? OFFSET ?
      `
      params = [`%${normalizedQuery}%`, limit, offset]
    } else {
      sqlStr = `
        SELECT id, name, normalized_name, description, metadata, created_at, updated_at
        FROM ext_people_registry_persons
        ORDER BY name ASC
        LIMIT ? OFFSET ?
      `
      params = [limit, offset]
    }

    const rows = await this.db.execute<{
      id: string
      name: string
      normalized_name: string
      description: string | null
      metadata: string | null
      created_at: string
      updated_at: string
    }>(sqlStr, params)

    return rows.map((row) =>
      recordToPerson({
        id: row.id,
        name: row.name,
        normalizedName: row.normalized_name,
        description: row.description,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    )
  }

  /**
   * Get a person by ID
   */
  async getById(id: string): Promise<Person | null> {
    await this.initialize()

    const rows = await this.db.execute<{
      id: string
      name: string
      normalized_name: string
      description: string | null
      metadata: string | null
      created_at: string
      updated_at: string
    }>(
      `SELECT id, name, normalized_name, description, metadata, created_at, updated_at
       FROM ext_people_registry_persons WHERE id = ?`,
      [id]
    )

    if (rows.length === 0) return null

    const row = rows[0]
    return recordToPerson({
      id: row.id,
      name: row.name,
      normalizedName: row.normalized_name,
      description: row.description,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  }

  /**
   * Get a person by name (exact match on normalized name)
   */
  async getByName(name: string): Promise<Person | null> {
    await this.initialize()

    const normalizedName = normalizeName(name)
    const rows = await this.db.execute<{
      id: string
      name: string
      normalized_name: string
      description: string | null
      metadata: string | null
      created_at: string
      updated_at: string
    }>(
      `SELECT id, name, normalized_name, description, metadata, created_at, updated_at
       FROM ext_people_registry_persons WHERE normalized_name = ?`,
      [normalizedName]
    )

    if (rows.length === 0) return null

    const row = rows[0]
    return recordToPerson({
      id: row.id,
      name: row.name,
      normalizedName: row.normalized_name,
      description: row.description,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  }

  /**
   * Create a new person
   */
  async create(input: PersonInput & { name: string }): Promise<Person> {
    await this.initialize()

    const now = new Date().toISOString()
    const id = generateId()
    const normalizedName = normalizeName(input.name)
    const description = input.description ?? null
    const metadata = input.metadata ?? null

    await this.db.execute(
      `INSERT INTO ext_people_registry_persons (id, name, normalized_name, description, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        normalizedName,
        description,
        metadata ? JSON.stringify(metadata) : null,
        now,
        now,
      ]
    )

    // Return the created record
    const record: PersonRecord = {
      id,
      name: input.name,
      normalizedName,
      description,
      metadata,
      createdAt: now,
      updatedAt: now,
    }

    return recordToPerson(record)
  }

  /**
   * Update an existing person
   */
  async update(id: string, input: PersonInput): Promise<Person | null> {
    await this.initialize()

    const existing = await this.getById(id)
    if (!existing) return null

    const now = new Date().toISOString()
    const updated: PersonRecord = {
      id: existing.id,
      name: input.name ?? existing.name,
      normalizedName: input.name ? normalizeName(input.name) : existing.normalizedName,
      description: input.description !== undefined ? (input.description ?? null) : (existing.description ?? null),
      metadata: input.metadata !== undefined ? (input.metadata ?? null) : (existing.metadata ?? null),
      createdAt: existing.createdAt,
      updatedAt: now,
    }

    await this.db.execute(
      `UPDATE ext_people_registry_persons
       SET name = ?, normalized_name = ?, description = ?, metadata = ?, updated_at = ?
       WHERE id = ?`,
      [
        updated.name,
        updated.normalizedName,
        updated.description,
        updated.metadata ? JSON.stringify(updated.metadata) : null,
        updated.updatedAt,
        id,
      ]
    )

    return recordToPerson(updated)
  }

  /**
   * Create or update a person by name
   * If a person with the same normalized name exists, update them.
   * Otherwise, create a new person.
   */
  async upsert(input: PersonInput & { name: string }): Promise<{ person: Person; created: boolean }> {
    await this.initialize()

    const existing = await this.getByName(input.name)

    if (existing) {
      const updated = await this.update(existing.id, input)
      return { person: updated!, created: false }
    } else {
      const created = await this.create(input)
      return { person: created, created: true }
    }
  }

  /**
   * Delete a person by ID
   */
  async delete(id: string): Promise<boolean> {
    await this.initialize()

    const existing = await this.getById(id)
    if (!existing) return false

    await this.db.execute('DELETE FROM ext_people_registry_persons WHERE id = ?', [id])
    return true
  }

  /**
   * Delete a person by name
   */
  async deleteByName(name: string): Promise<boolean> {
    await this.initialize()

    const existing = await this.getByName(name)
    if (!existing) return false

    await this.db.execute('DELETE FROM ext_people_registry_persons WHERE id = ?', [existing.id])
    return true
  }
}
