import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

const SOURCE_DIR = path.join(process.cwd(), 'data', 'source')
const OUTPUT_FILE = path.join(process.cwd(), 'app', 'data', 'test-data.ts')
const TEST_DATA_WORKSPACE_ID = process.env.TEST_DATA_WORKSPACE_ID!;
// Read and parse TSV file
function parseTsvFile(filename: string) {
  const filePath = path.join(SOURCE_DIR, filename)
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return parse(fileContent, {
    columns: true,
    delimiter: '\t',
    skip_empty_lines: true
  })
}

// Main build function
async function buildTestData() {
  // Parse all TSV files
  const tickets = parseTsvFile('tickets.tsv').map((ticket: any) => ({
    subject: ticket.subject,
    description: ticket.description,
    email: ticket.email,
    status: ticket.status,
    priority: ticket.priority,
    workspace_id: TEST_DATA_WORKSPACE_ID
  }))
  const messages = parseTsvFile('messages.tsv').map((message: any) => ({
    content: message.content,
    sender_type: message.sender_type,
    room_id: "placeholder-room-id",
  }))
  const articles = parseTsvFile('articles.tsv').map((article: any) => ({
    ...article,
    tags: article.tags.split(',')
  }))
  const documents = parseTsvFile('documents.tsv').map((document: any) => ({
    ...document,
    tags: document.tags.split(','),
    workspace_id: TEST_DATA_WORKSPACE_ID
  }))

  // Generate TypeScript file content
  const fileContent = `// Generated file - do not edit directly
// Edit source files in data/source/ instead

export const testData = {
  tickets: ${JSON.stringify(tickets, null, 2)},
  messages: ${JSON.stringify(messages, null, 2)},
  articles: ${JSON.stringify(articles, null, 2)},
  documents: ${JSON.stringify(documents, null, 2)}
} as const

export type TestData = typeof testData`

  // Write output file
  fs.writeFileSync(OUTPUT_FILE, fileContent)
  console.log(`Generated ${OUTPUT_FILE}`)
}

// Run the build
buildTestData().catch(console.error) 