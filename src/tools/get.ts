/**
 * Get Person Tool
 *
 * Get detailed information about a specific person.
 */

import type { Tool, ToolResult, ExecutionContext } from '@stina/extension-api/runtime'
import { PeopleRepository } from '../db/repository.js'

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
 * Create the get person tool.
 * Uses user-scoped storage to ensure proper data isolation.
 *
 * @returns The Tool instance for getting person details
 */
export function createGetTool(): Tool {
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

    async execute(params: Record<string, unknown>, execContext: ExecutionContext): Promise<ToolResult> {
      try {
        const { id, name } = params as GetParams

        if (!id && !name) {
          return {
            success: false,
            error: 'Either id or name must be provided',
          }
        }

        // Create repository with user-scoped storage
        const repository = new PeopleRepository(execContext.userStorage)

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

        const metadata = person.metadata ?? {}
        const data: Record<string, unknown> = {
          id: person.id,
          name: person.name,
          description: person.description,
          createdAt: person.createdAt,
          updatedAt: person.updatedAt,
        }

        if (metadata.relationship !== undefined) data.relationship = metadata.relationship
        if (metadata.email !== undefined) data.email = metadata.email
        if (metadata.phone !== undefined) data.phone = metadata.phone
        if (metadata.birthday !== undefined) data.birthday = metadata.birthday
        if (metadata.workplace !== undefined) data.workplace = metadata.workplace

        return {
          success: true,
          data,
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
