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

// Parse tickets and messages into a hierarchical structure
function parseTicketsWithMessages(rows: any[]) {
  const tickets: any[] = []

  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];
    if (row.type === 'ticket') {
      tickets.push({
        subject: row.subject,
        description: row.description,
        email: row.email,
        status: row.status,
        priority: row.priority,
        created_at: row.created_at,
        messages: []
      })
    }
    if (row.type === 'message') {
        tickets[tickets.length - 1].messages.push({
            content: row.content,
            sender_type: row.sender_type,
            created_at: row.created_at
        })
    }
  }

  return tickets
}

// Main build function
async function buildTestData() {
  // Parse tickets with messages
  const ticketsWithMessages = parseTicketsWithMessages(
    parseTsvFile('tickets-with-messages.tsv')
  )

  // Parse other files
  const articles = parseTsvFile('articles.tsv').map((article: any) => ({
    ...article,
    tags: article.tags.split(',').map((t: string) => t.trim())
  }))
  const documents = parseTsvFile('documents.tsv').map((document: any) => ({
    ...document,
    tags: document.tags.split(',').map((t: string) => t.trim()),
    workspace_id: TEST_DATA_WORKSPACE_ID
  }))

  // Generate TypeScript file content
  const fileContent = `// Generated file - do not edit directly
// Edit source files in data/source/ instead

export const testData = {
  tickets: ${JSON.stringify(ticketsWithMessages, null, 2)},
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