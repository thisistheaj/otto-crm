import type { TestData } from "~/types/test-data";

// Get workspace ID from environment
const TEST_DATA_WORKSPACE_ID = process.env.TEST_DATA_WORKSPACE_ID!;

// Sample test data - minimal set for testing the seeding process
export const testData: TestData = {
  tickets: [
    {
      subject: "Cannot login to account",
      description: "I've tried resetting my password but still can't get in",
      email: "customer1@example.com",
      status: "new",
      priority: "high",
      workspace_id: TEST_DATA_WORKSPACE_ID
    },
    {
      subject: "Question about billing",
      description: "I was charged twice for my subscription",
      email: "customer2@example.com",
      status: "open",
      priority: "normal",
      workspace_id: TEST_DATA_WORKSPACE_ID
    },
    {
      subject: "Feature request",
      description: "Would love to see dark mode support",
      email: "customer3@example.com",
      status: "closed",
      priority: "low",
      workspace_id: TEST_DATA_WORKSPACE_ID
    }
  ],
  messages: [
    {
      content: "Hi, I noticed two charges on my credit card statement",
      sender_type: "customer",
      room_id: "placeholder-room-id" // This will be replaced with actual room ID
    },
    {
      content: "I'll look into this right away. Can you tell me the dates of the charges?",
      sender_type: "agent",
      room_id: "placeholder-room-id" // This will be replaced with actual room ID
    }
  ],
  articles: [
    {
      title: "Getting Started Guide",
      content: "Welcome to our platform! This guide will help you get started...",
      status: "published",
      author_id: "68312e83-93a2-48ae-90f7-124e6c01182a",
      tags: [],
      workspace_id: TEST_DATA_WORKSPACE_ID
    }
  ],
  documents: [
    {
      title: "Architecture Decision Record",
      file_name: "architecture-decision-record.pdf",
      file_path: `${TEST_DATA_WORKSPACE_ID}/architecture-decision-record.pdf`,
      status: "published",
      uploader_id: "68312e83-93a2-48ae-90f7-124e6c01182a",
      tags: ["architecture", "technical"],
      workspace_id: TEST_DATA_WORKSPACE_ID
    },
    {
      title: "BigCorp Requirements",
      file_name: "bigcorp-requirements.pdf",
      file_path: `${TEST_DATA_WORKSPACE_ID}/bigcorp-requirements.pdf`,
      status: "published",
      uploader_id: "68312e83-93a2-48ae-90f7-124e6c01182a",
      tags: ["requirements", "client"],
      workspace_id: TEST_DATA_WORKSPACE_ID
    }
  ]
}; 