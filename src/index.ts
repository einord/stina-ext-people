/**
 * People Registry Extension for Stina
 *
 * Keep track of people mentioned in conversations.
 * Stina can remember names, relationships, and details about the people in your life.
 *
 * This extension uses user-scoped storage, meaning each user has their own isolated
 * people registry that is not shared with other users.
 *
 * @module stina-ext-people
 */

import { initializeExtension, type ExtensionContext, type Disposable } from '@stina/extension-api/runtime'

import { createListTool, createGetTool, createUpsertTool, createDeleteTool } from './tools/index.js'

/**
 * Extension activation.
 *
 * Called when the extension is loaded by Stina.
 * Registers all tools for managing people in the registry.
 * Each tool uses user-scoped storage (userStorage) to ensure data isolation between users.
 *
 * @param context - The extension context provided by Stina
 * @returns A Disposable that cleans up registered tools when the extension is deactivated
 */
function activate(context: ExtensionContext): Disposable {
  context.log.info('Activating People Registry extension')

  // Create and register tools
  // Note: Tools now use userStorage from ExecutionContext for user-scoped data
  const listTool = createListTool()
  const getTool = createGetTool()
  const upsertTool = createUpsertTool()
  const deleteTool = createDeleteTool()

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
 * Extension deactivation.
 *
 * Called when the extension is unloaded.
 * Cleanup is handled by the disposable returned from activate.
 */
function deactivate(): void {
  // Cleanup is handled by the disposable returned from activate
}

// Initialize the extension runtime
initializeExtension({ activate, deactivate })
