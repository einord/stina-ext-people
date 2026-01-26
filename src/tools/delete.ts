/**
 * Delete Person Tool
 *
 * Remove a person from the registry.
 */

import type { Tool, ToolResult, ExecutionContext } from '@stina/extension-api/runtime'
import type { PeopleRepository } from '../db/repository.js'

/**
 * Parameters for the delete tool
 */
interface DeleteParams {
  /** Person ID */
  id?: string
  /** Person name */
  name?: string
}

/**
 * Create the delete person tool
 */
export function createDeleteTool(repository: PeopleRepository): Tool {
  return {
    id: 'people_delete',
    name: 'Delete Person',
    description: 'Remove a person from the registry by ID or name.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The unique ID of the person to delete',
        },
        name: {
          type: 'string',
          description: 'The name of the person to delete',
        },
      },
    },

    async execute(params: Record<string, unknown>, _execContext: ExecutionContext): Promise<ToolResult> {
      try {
        const { id, name } = params as DeleteParams

        if (!id && !name) {
          return {
            success: false,
            error: 'Either id or name must be provided',
          }
        }

        let deleted = false

        if (id) {
          deleted = await repository.delete(id)
        } else if (name) {
          deleted = await repository.deleteByName(name)
        }

        if (!deleted) {
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
            deleted: true,
            message: `Successfully removed ${name || id} from the registry`,
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
