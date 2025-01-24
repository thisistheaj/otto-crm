# Test Data Management

## Overview
This document outlines the plan for managing test data in the Otto CRM system, including seeding and clearing data for testing purposes.

## Prerequisites
- Workspace ID: [to be provided]
- 5 test agents with the following roles:
  - Agent 1: Admin + Agent (will be used as author for all articles)
  - Agent 2-5: Agent only
- PDF files manually uploaded to Supabase storage at least once

## Data Distribution

### Tickets (Total: 100)
Distribution by status:
- New: 20%
  - 10 with no messages
  - 10 with initial customer message only
- Open: 50%
  - 25 active conversations (2-5 messages)
  - 15 waiting for customer (last message from agent)
  - 10 waiting for agent (last message from customer)
- Closed: 30%
  - 20 resolved successfully
  - 10 abandoned/timeout

Distribution by priority:
- High: 20%
- Normal: 60%
- Low: 20%

Distribution by agent assignment:
- Unassigned: 15%
- Agent 2: 25%
- Agent 3: 25%
- Agent 4: 20%
- Agent 5: 15%

### Messages (Variable Total)
- Average 4 messages per active ticket
- Message patterns:
  - Customer -> Agent -> Customer -> Agent (resolution)
  - Customer -> Agent -> Customer (waiting for agent)
  - Customer -> Agent (waiting for customer)
  - Customer only (new ticket)

### Articles (Total: 20)
Distribution by topic:
- Getting Started: 4
- Account Management: 4
- Billing & Payments: 4
- Common Issues: 4
- Advanced Features: 4

### Documents (Total: 10)
Distribution by type:
- User Guides: 3
- Technical Documentation: 3
- Policy Documents: 2
- Release Notes: 2

## Timestamp Strategy
All timestamps will be generated relative to the current date:

1. Historical Range:
   - Oldest record: 90 days ago
   - Newest record: Current time
   - Distribution: Weighted towards recent dates

2. Patterns:
   - Business hours (9am-5pm) more common
   - Response times:
     - High priority: 0-2 hours
     - Normal priority: 2-8 hours
     - Low priority: 8-24 hours
   - Weekend gaps in responses
   - Occasional after-hours responses

3. Implementation:
   ```typescript
   // Supabase allows setting created_at/updated_at
   const { data } = await supabase
     .from('tickets')
     .insert({
       ...ticketData,
       created_at: historicalTimestamp,
       updated_at: historicalTimestamp
     })
   ```

## Data Structure

### Source Files (for generation/editing)
TSV files are used for structured data, with articles stored as markdown files.

1. `data/source/tickets.tsv`:
   ```
   subject	description	email	status	priority	assigned_agent_id
   ```

2. `data/source/messages.tsv`:
   ```
   ticket_id	content	sender_type	timestamp
   ```

3. `data/source/articles/` - Directory containing .md files:
   ```markdown
   # Article Title

   Article content goes here...
   ```
   Note: Each article will be created with:
   - Title: Extracted from H1
   - Content: Everything after H1
   - Status: Always "published"
   - Author: Admin agent ID
   - Tags: Empty array

4. `data/source/documents.tsv`:
   ```
   title	file_name	file_path	tags	status	uploader_id
   ```
   Note: The actual PDF files should be uploaded to Supabase storage manually once. 
   The seeding process will only create database records pointing to these existing files.
   We will generate a few PDFs from .md files with a tool like pandoc and weasyprint.

### Generated TypeScript Files
Source files are converted to TypeScript for use in the application:

```typescript
// app/data/test-data.ts
export const testData = {
  tickets: [
    {
      subject: string;
      description: string;
      email: string;
      status: "new" | "open" | "closed";
      priority: "low" | "normal" | "high";
      assigned_agent_id: string;
    }[]
  ],
  messages: [
    {
      ticket_id: string;
      content: string;
      sender_type: "agent" | "customer";
      timestamp: string;
    }[]
  ],
  articles: [
    {
      title: string;
      content: string;
      status: "published";
      author_id: string; // Always admin ID
      tags: never[]; // Always empty array
    }[]
  ],
  documents: [
    {
      title: string;
      file_name: string;
      file_path: string;
      tags: string[];
      status: "draft" | "published";
      uploader_id: string;
    }[]
  ]
}
```

## Build Process

1. Generate/Edit Source Files:
   - Use LLM to generate TSV files and markdown articles
   - Manual editing if needed
   - Store in `data/source/`

2. Build TypeScript Files:
   ```bash
   npm run build:test-data
   ```
   This will:
   - Parse TSV files into structured data
   - Parse markdown files for articles
   - Generate typed TypeScript files
   - Output to `app/data/test-data.ts`

## API Routes

### Seed Data Route
`POST /api/admin/test-data/seed`
- Environment variable:
  - `TEST_DATA_WORKSPACE_ID`
- Headers: 
  - `x-admin-key: $ADMIN_API_KEY`
- Actions:
  1. Validates workspace exists
  2. Imports test data from TypeScript files
  3. Creates in order:
     - Articles (using admin as author)
     - Documents (referencing existing PDFs in storage)
     - Tickets
     - Chat rooms (one per ticket)
     - Messages
  4. Returns summary of created items

### Clear Data Route
`POST /api/admin/test-data/clear`
- Environment variable:
  - `TEST_DATA_WORKSPACE_ID`
- Headers:
  - `x-admin-key: $ADMIN_API_KEY`
- Actions:
  1. Validates workspace exists
  2. Deletes in order:
     - Messages
     - Chat rooms
     - Tickets
     - Document records (from database only, preserves files in storage)
     - Articles
  3. Does NOT delete:
     - Workspace
     - Workspace members
     - User profiles
     - PDF files in storage
  4. Returns summary of deleted items

## Usage

1. First-time setup:
```bash
# Create workspace and agents manually
# Note the workspace ID and agent IDs

# Upload PDF files to Supabase storage manually
# Note the file paths

# Generate source files
npm run generate-test-data

# Build TypeScript files
npm run build:test-data

# Seed the data
curl -X POST http://localhost:3000/api/admin/test-data/seed \
  -H "x-admin-key: $ADMIN_API_KEY"
```

2. Clear data:
```bash
# Clear all test data (preserves PDFs in storage)
curl -X POST http://localhost:3000/api/admin/test-data/clear \
  -H "x-admin-key: $ADMIN_API_KEY"
```

## Test Data Generation
The test data will be generated using an LLM to create realistic:
- Customer support tickets with conversations
- Knowledge base articles (as markdown files)
- Document metadata
All structured data will be output in TSV format for easy editing before being converted to TypeScript.

This ensures the test data is:
- Realistic and varied
- Consistently formatted
- Covers various scenarios
- Includes edge cases
- Easy to edit manually if needed
- Type-safe when used in the application 