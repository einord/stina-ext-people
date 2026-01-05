/**
 * Get Person Tool
 *
 * Get detailed information about a specific person.
 */

import type { Tool, ToolResult } from '@stina/extension-api/runtime'
import type { PeopleRepository } from '../db/repository.js'

/**
 * Parameters for the get tool
 */
interface GetParams {
  /** Person ID */
  id?: string
  /** Person name */
  name?: string
}

/**
 * Create the get person tool
 */
export function createGetTool(repository: PeopleRepository): Tool {
  return {
    id: 'people_get',
    name: 'Get Person',
    description: 'Get detailed information about a specific person by ID or name.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The unique ID of the person',
        },
        name: {
          type: 'string',
          description: 'The name of the person to look up',
        },
      },
    },

    async execute(params: Record<string, unknown>): Promise<ToolResult> {
      try {
        const { id, name } = params as GetParams

        if (!id && !name) {
          return {
            success: false,
            error: 'Either id or name must be provided',
          }
        }

        let person = null

        if (id) {
          person = await repository.getById(id)
        } else if (name) {
          person = await repository.getByName(name)
        }

        if (!person) {
          return {
            success: false,
            error: id
              ? `No person found with ID "${id}"`
              : `No person found with name "${name}"`,
          }
        }

        return {
          success: true,
          data: {
            id: person.id,
            name: person.name,
            description: person.description,
            metadata: person.metadata,
            createdAt: person.createdAt,
            updatedAt: person.updatedAt,
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
