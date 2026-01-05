#!/usr/bin/env node

/**
 * Pack the extension for distribution
 *
 * Creates a zip file containing:
 * - manifest.json
 * - dist/index.js
 * - README.md
 *
 * Output is placed in the releases/ directory.
 */

import { readFileSync, existsSync, mkdirSync, createWriteStream } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import archiver from 'archiver'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const releasesDir = join(rootDir, 'releases')

// Read manifest for version
let manifest
try {
  manifest = JSON.parse(readFileSync(join(rootDir, 'manifest.json'), 'utf-8'))
} catch (error) {
  console.error('Error: Failed to read manifest.json:', error.message)
  process.exit(1)
}

const outputName = `${manifest.id}-${manifest.version}.zip`
const outputPath = join(releasesDir, outputName)

// Check if required files exist
const requiredFiles = [
  { path: join(rootDir, 'dist', 'index.js'), name: 'dist/index.js' },
  { path: join(rootDir, 'manifest.json'), name: 'manifest.json' },
  { path: join(rootDir, 'README.md'), name: 'README.md' }
]

for (const file of requiredFiles) {
  if (!existsSync(file.path)) {
    console.error(`Error: ${file.name} not found.${file.name === 'dist/index.js' ? ' Run "pnpm build" first.' : ''}`)
    process.exit(1)
  }
}

// Ensure releases directory exists
if (!existsSync(releasesDir)) {
  try {
    mkdirSync(releasesDir, { recursive: true })
    console.log('Created releases/ directory')
  } catch (error) {
    console.error('Error: Failed to create releases directory:', error.message)
    process.exit(1)
  }
}

// Create zip file using archiver
const output = createWriteStream(outputPath)
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
})

output.on('close', () => {
  console.log(`\n✓ Created: releases/${outputName} (${archive.pointer()} bytes)`)
  console.log('\nTo create a release:')
  console.log('1. Push changes to main branch')
  console.log('2. GitHub Action will automatically create a release')
})

archive.on('error', (error) => {
  console.error('Error: Failed to create zip file:', error.message)
  process.exit(1)
})

archive.on('warning', (error) => {
  if (error.code === 'ENOENT') {
    console.warn('Warning:', error.message)
  } else {
    console.error('Error: Failed to create zip file:', error.message)
    process.exit(1)
  }
})

// Pipe archive data to the file
archive.pipe(output)

// Add files to archive
try {
  archive.file(join(rootDir, 'manifest.json'), { name: 'manifest.json' })
  archive.file(join(rootDir, 'dist', 'index.js'), { name: 'index.js' })
  archive.file(join(rootDir, 'README.md'), { name: 'README.md' })
  
  // Finalize the archive
  archive.finalize()
} catch (error) {
  console.error('Error: Failed to add files to zip archive:', error.message)
  process.exit(1)
}
