/**
 * People Repository
 *
 * CRUD operations for the People Registry using the Extension Storage API.
 * This provides a document-based storage approach instead of direct SQLite.
 */

import type { StorageAPI } from '@stina/extension-api/runtime'
import type { Person, PersonInput, ListPeopleOptions } from '../types.js'

/** Collection name for people documents */
const COLLECTION = 'people'

/**
 * Document structure stored in the collection.
 * This matches the Person interface but is stored as a JSON document.
 */
interface PersonDocument {
  id: string
  name: string
  normalizedName: string
  description?: string
  metadata?: {
    relationship?: string
    email?: string
    phone?: string
    birthday?: string
    workplace?: string
    [key: string]: unknown
  }
  createdAt: string
  updatedAt: string
}

/**
 * Generate a unique ID for a new person.
 *
 * @returns A unique identifier string
 */
function generateId(): string {
  return `person_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Normalize a name for searching.
 * Converts to lowercase and trims whitespace.
 *
 * @param name - The name to normalize
 * @returns The normalized name
 */
function normalizeName(name: string): string {
  return name.toLowerCase().trim()
}

/**
 * Convert a document to a Person object.
 *
 * @param doc - The document from storage
 * @returns A Person object
 */
function documentToPerson(doc: PersonDocument): Person {
  return {
    id: doc.id,
    name: doc.name,
    normalizedName: doc.normalizedName,
    description: doc.description,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

/**
 * People Repository class.
 *
 * Provides CRUD operations for managing people in the registry.
 * Uses the Extension Storage API for document-based persistence.
 * Each instance should be created with user-scoped storage for proper data isolation.
 */
export class PeopleRepository {
  private storage: StorageAPI

  /**
   * Create a new PeopleRepository.
   *
   * @param storage - The StorageAPI instance to use (should be userStorage for user-scoped data)
   */
  constructor(storage: StorageAPI) {
    this.storage = storage
  }

  /**
   * List people with optional filtering.
   * Supports filtering by name query and pagination.
   *
   * @param options - Filter and pagination options
   * @returns Array of matching Person objects
   */
  async list(options: ListPeopleOptions = {}): Promise<Person[]> {
    const { query, limit = 50, offset = 0 } = options

    let docs: PersonDocument[]

    if (query) {
      const normalizedQuery = normalizeName(query)
      // Use $contains for case-insensitive partial matching on normalizedName
      docs = await this.storage.find<PersonDocument>(
        COLLECTION,
        { normalizedName: { $contains: normalizedQuery } },
        { sort: { name: 'asc' }, limit, offset }
      )
    } else {
      docs = await this.storage.find<PersonDocument>(
        COLLECTION,
        {},
        { sort: { name: 'asc' }, limit, offset }
      )
    }

    return docs.map(documentToPerson)
  }

  /**
   * Get a person by ID.
   *
   * @param id - The unique identifier of the person
   * @returns The Person if found, or null if not found
   */
  async getById(id: string): Promise<Person | null> {
    const doc = await this.storage.get<PersonDocument>(COLLECTION, id)
    return doc ? documentToPerson(doc) : null
  }

  /**
   * Get a person by name (exact match on normalized name).
   *
   * @param name - The name to search for
   * @returns The Person if found, or null if not found
   */
  async getByName(name: string): Promise<Person | null> {
    const normalizedName = normalizeName(name)
    const doc = await this.storage.findOne<PersonDocument>(COLLECTION, {
      normalizedName: normalizedName,
    })
    return doc ? documentToPerson(doc) : null
  }

  /**
   * Create a new person.
   *
   * @param input - The person data including required name
   * @returns The created Person object
   */
  async create(input: PersonInput & { name: string }): Promise<Person> {
    const now = new Date().toISOString()
    const id = generateId()
    const normalizedName = normalizeName(input.name)

    const doc: PersonDocument = {
      id,
      name: input.name,
      normalizedName,
      description: input.description,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    }

    await this.storage.put(COLLECTION, id, doc)

    return documentToPerson(doc)
  }

  /**
   * Update an existing person.
   *
   * @param id - The ID of the person to update
   * @param input - The fields to update
   * @returns The updated Person, or null if not found
   */
  async update(id: string, input: PersonInput): Promise<Person | null> {
    const existing = await this.getById(id)
    if (!existing) return null

    const now = new Date().toISOString()
    const doc: PersonDocument = {
      id: existing.id,
      name: input.name ?? existing.name,
      normalizedName: input.name ? normalizeName(input.name) : existing.normalizedName,
      description: input.description !== undefined ? input.description : existing.description,
      metadata: input.metadata !== undefined ? input.metadata : existing.metadata,
      createdAt: existing.createdAt,
      updatedAt: now,
    }

    await this.storage.put(COLLECTION, id, doc)

    return documentToPerson(doc)
  }

  /**
   * Create or update a person by name.
   * If a person with the same normalized name exists, update them.
   * Otherwise, create a new person.
   *
   * @param input - The person data including required name
   * @returns Object containing the person and whether it was newly created
   */
  async upsert(input: PersonInput & { name: string }): Promise<{ person: Person; created: boolean }> {
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
   * Delete a person by ID.
   *
   * @param id - The ID of the person to delete
   * @returns True if the person was deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id)
    if (!existing) return false

    return await this.storage.delete(COLLECTION, id)
  }

  /**
   * Delete a person by name.
   *
   * @param name - The name of the person to delete
   * @returns True if the person was deleted, false if not found
   */
  async deleteByName(name: string): Promise<boolean> {
    const existing = await this.getByName(name)
    if (!existing) return false

    return await this.storage.delete(COLLECTION, existing.id)
  }
}
