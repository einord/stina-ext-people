# People Registry for Stina

Keep track of people mentioned in conversations. [Stina](https://github.com/einord/stina) can remember names, relationships, and details about the people in your life.

## Features

- **Remember People**: Stina automatically saves information about people you mention
- **Smart Matching**: Finds existing people by name, even with slight variations
- **Rich Metadata**: Store relationships, contact info, birthdays, and more
- **Privacy First**: All data stored locally in your Stina database

## Tools

This extension provides four AI tools:

| Tool | Description |
|------|-------------|
| `people_list` | Search and list people in the registry |
| `people_get` | Get detailed information about a specific person |
| `people_upsert` | Add a new person or update existing information |
| `people_delete` | Remove a person from the registry |

## How It Works

When you mention someone in a conversation, Stina can:

1. **Recognize** when you're talking about a person
2. **Check** if they're already in the registry
3. **Save** new information or update existing records
4. **Recall** details when you ask about someone

### Example Conversations

> **You**: "I had lunch with Maria today. She works at Spotify."
>
> **Stina**: *Uses `people_upsert` to save Maria with workplace: Spotify*

> **You**: "When is Maria's birthday?"
>
> **Stina**: *Uses `people_get` to look up Maria's information*

## Installation

### From Stina Extension Browser

1. Open Stina
2. Go to Extensions
3. Search for "People Registry"
4. Click Install

### Manual Installation

1. Download the latest release from [Releases](https://github.com/einord/stina-ext-people/releases)
2. Install the extension in Stina
3. Restart Stina if needed

## Data Storage

The extension stores data in Stina's database using the `database.own` permission. Data is stored in a table prefixed with `ext_people_` to avoid conflicts.

### Person Record Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Display name |
| `description` | string | Notes about the person |
| `relationship` | string | Relationship to you (friend, colleague, family, etc.) |
| `email` | string | Email address |
| `phone` | string | Phone number |
| `birthday` | string | Birthday (YYYY-MM-DD) |
| `workplace` | string | Workplace or company |

## Permissions

This extension requires the following permissions:

- `tools.register` - Register AI tools for managing people
- `database.own` - Store people data in the local database

## Development

### Prerequisites

- Node.js 20+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode (rebuild on changes)
pnpm dev

# Type check
pnpm typecheck

# Create release package
pnpm pack-extension
```

### Project Structure

```
src/
├── index.ts           # Extension entry point
├── types.ts           # Type definitions
├── db/
│   ├── schema.ts      # Drizzle ORM schema
│   └── repository.ts  # Database operations
└── tools/
    ├── index.ts       # Tool exports
    ├── list.ts        # people_list tool
    ├── get.ts         # people_get tool
    ├── upsert.ts      # people_upsert tool
    └── delete.ts      # people_delete tool
```

### Creating a Release

1. Update the version in `manifest.json` and `package.json`
2. Build the extension: `pnpm build`
3. Create the release package: `pnpm pack-extension`
4. Output: `releases/people-registry-x.x.x.zip`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
