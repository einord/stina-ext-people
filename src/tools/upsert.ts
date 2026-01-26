/**
 * Upsert Person Tool
 *
 * Add a new person or update an existing person's information.
 */

import type { Tool, ToolResult, ExecutionContext } from '@stina/extension-api/runtime'
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

    async execute(params: Record<string, unknown>, _execContext: ExecutionContext): Promise<ToolResult> {
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

        // When updating by ID, name is optional; when creating/upserting by name, name is required
        if (!id && (!name || typeof name !== 'string' || name.trim() === '')) {
          return {
            success: false,
            error: 'Name is required when not updating by ID',
          }
        }

        // Build metadata from provided fields
        // Track which fields were explicitly provided (even if empty string, to allow clearing)
        const hasMetadataFields = 
          relationship !== undefined || 
          email !== undefined || 
          phone !== undefined || 
          birthday !== undefined || 
          workplace !== undefined

        if (id) {
          // When updating by ID, we need to merge metadata with existing values
          const existing = await repository.getById(id)
          if (!existing) {
            return {
              success: false,
              error: `No person found with ID "${id}"`,
            }
          }

          // Start with existing metadata or empty object
          const mergedMetadata: PersonMetadata = { ...(existing.metadata || {}) }
          
          // Update only the fields that were explicitly provided
          // Empty strings clear the field (set to undefined)
          if (relationship !== undefined) {
            mergedMetadata.relationship = relationship.trim() || undefined
          }
          if (email !== undefined) {
            mergedMetadata.email = email.trim() || undefined
          }
          if (phone !== undefined) {
            mergedMetadata.phone = phone.trim() || undefined
          }
          if (birthday !== undefined) {
            mergedMetadata.birthday = birthday.trim() || undefined
          }
          if (workplace !== undefined) {
            mergedMetadata.workplace = workplace.trim() || undefined
          }

          const updated = await repository.update(id, {
            name: name?.trim(),
            description,
            // Only update metadata if at least one metadata field was provided
            metadata: hasMetadataFields ? mergedMetadata : undefined,
          })

          return {
            success: true,
            data: {
              id: updated!.id,
              name: updated!.name,
              description: updated!.description,
              metadata: updated!.metadata,
              created: false,
              message: `Updated information for "${updated!.name}"`,
            },
          }
        }

        // For create/upsert by name, build metadata from provided fields
        const metadata: PersonMetadata = {}
        if (relationship?.trim()) metadata.relationship = relationship.trim()
        if (email?.trim()) metadata.email = email.trim()
        if (phone?.trim()) metadata.phone = phone.trim()
        if (birthday?.trim()) metadata.birthday = birthday.trim()
        if (workplace?.trim()) metadata.workplace = workplace.trim()

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
