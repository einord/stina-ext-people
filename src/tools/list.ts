/**
 * List People Tool
 *
 * Search and list people in the registry.
 */

import type { Tool, ToolResult } from '@stina/extension-api/runtime'
import type { PeopleRepository } from '../db/repository.js'

/**
 * Parameters for the list tool
 */
interface ListParams {
  /** Search query (optional) */
  query?: string
  /** Maximum results (default: 20) */
  limit?: number
}

/**
 * Create the list people tool
 */
export function createListTool(repository: PeopleRepository): Tool {
  return {
    id: 'people_list',
    name: 'List People',
    description: 'Search and list people in the registry. Can filter by name.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to filter people by name',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)',
        },
      },
    },

    async execute(params: Record<string, unknown>): Promise<ToolResult> {
      try {
        const { query, limit = 20 } = params as ListParams

        const people = await repository.list({
          query,
          limit: Math.min(limit, 100), // Cap at 100
        })

        if (people.length === 0) {
          return {
            success: true,
            data: {
              count: 0,
              people: [],
              message: query
                ? `No people found matching "${query}"`
                : 'No people in the registry yet',
            },
          }
        }

        return {
          success: true,
          data: {
            count: people.length,
            people: people.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              relationship: p.metadata?.relationship,
            })),
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
