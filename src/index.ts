/**
 * People Registry Extension for Stina
 *
 * Keep track of people mentioned in conversations.
 * Stina can remember names, relationships, and details about the people in your life.
 *
 * @module stina-ext-people
 */

import { initializeExtension, type ExtensionContext, type Disposable } from '@stina/extension-api/runtime'

import { PeopleRepository } from './db/repository.js'
import { createListTool, createGetTool, createUpsertTool, createDeleteTool } from './tools/index.js'

/**
 * Extension activation
 *
 * Called when the extension is loaded by Stina.
 */
function activate(context: ExtensionContext): Disposable {
  context.log.info('Activating People Registry extension')

  // Initialize repository with the database API
  const repository = new PeopleRepository(context.database!)

  // Create and register tools
  const listTool = createListTool(repository)
  const getTool = createGetTool(repository)
  const upsertTool = createUpsertTool(repository)
  const deleteTool = createDeleteTool(repository)

  const disposables = [
    context.tools!.register(listTool),
    context.tools!.register(getTool),
    context.tools!.register(upsertTool),
    context.tools!.register(deleteTool),
  ]

  context.log.info('People Registry tools registered', {
    tools: ['people_list', 'people_get', 'people_upsert', 'people_delete'],
  })

  // Return combined disposable
  return {
    dispose: () => {
      for (const d of disposables) {
        d.dispose()
      }
      context.log.info('People Registry extension deactivated')
    },
  }
}

/**
 * Extension deactivation
 *
 * Called when the extension is unloaded.
 * Cleanup is handled by the disposable returned from activate.
 */
function deactivate(): void {
  // Cleanup is handled by the disposable returned from activate
}

// Initialize the extension runtime
initializeExtension({ activate, deactivate })
