/**
 * Upsert Person Tool
 *
 * Add a new person or update an existing person's information.
 */

import type { Tool, ToolResult } from '@stina/extension-api/runtime'
import type { PeopleRepository } from '../db/repository.js'
import type { PersonMetadata } from '../types.js'

/**
 * Parameters for the upsert tool
 */
interface UpsertParams {
  /** Person ID (optional, for updates) */
  id?: string
  /** Person name (required) */
  name: string
  /** Description or notes about the person */
  description?: string
  /** Relationship to the user */
  relationship?: string
  /** Email address */
  email?: string
  /** Phone number */
  phone?: string
  /** Birthday (ISO date string) */
  birthday?: string
  /** Workplace or company */
  workplace?: string
}

/**
 * Create the upsert person tool
 */
export function createUpsertTool(repository: PeopleRepository): Tool {
  return {
    id: 'people_upsert',
    name: 'Add/Update Person',
    description:
      'Add a new person or update an existing person. If a person with the same name exists, their information will be updated.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The unique ID of the person to update',
        },
        name: {
          type: 'string',
          description: 'The name of the person (required)',
        },
        description: {
          type: 'string',
          description: 'A description or notes about this person',
        },
        relationship: {
          type: 'string',
          description: 'The relationship to the user (e.g., friend, colleague, family)',
        },
        email: {
          type: 'string',
          description: 'Email address',
        },
        phone: {
          type: 'string',
          description: 'Phone number',
        },
        birthday: {
          type: 'string',
          description: 'Birthday in ISO format (YYYY-MM-DD)',
        },
        workplace: {
          type: 'string',
          description: 'Workplace or company name',
        },
      },
      required: ['name'],
    },

    async execute(params: Record<string, unknown>): Promise<ToolResult> {
      try {
        const {
          id,
          name,
          description,
          relationship,
          email,
          phone,
          birthday,
          workplace,
        } = params as Partial<UpsertParams>

        if (!id && (!name || typeof name !== 'string' || name.trim() === '')) {
          return {
            success: false,
            error: 'Name is required and must be a non-empty string',
          }
        }

        // Build metadata from provided fields
        const metadata: PersonMetadata = {}
        if (relationship) metadata.relationship = relationship
        if (email) metadata.email = email
        if (phone) metadata.phone = phone
        if (birthday) metadata.birthday = birthday
        if (workplace) metadata.workplace = workplace

        if (id) {
          const updated = await repository.update(id, {
            name: name?.trim(),
            description,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          })

          if (!updated) {
            return {
              success: false,
              error: `No person found with ID "${id}"`,
            }
          }

          return {
            success: true,
            data: {
              id: updated.id,
              name: updated.name,
              description: updated.description,
              metadata: updated.metadata,
              created: false,
              message: `Updated information for "${updated.name}"`,
            },
          }
        }

        const { person, created } = await repository.upsert({
          name: name!.trim(),
          description,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        })

        return {
          success: true,
          data: {
            id: person.id,
            name: person.name,
            description: person.description,
            metadata: person.metadata,
            created,
            message: created
              ? `Added "${person.name}" to the registry`
              : `Updated information for "${person.name}"`,
          },
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    },
  }
}
