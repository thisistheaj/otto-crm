# Data Types

## Auth & Profiles

### User (auth.users - handled by Supabase)
```typescript
// Managed by Supabase Auth
interface User {
  id: string;                // UUID from auth.users
  email: string;
  email_verified: boolean;
  created_at: DateTime;
  updated_at: DateTime;
  last_sign_in_at: DateTime;
}
```

### Profile (public.profiles)
```typescript
{
  id: string;                // References auth.users(id)
  full_name: string;
  avatar_url?: string;
  updated_at: DateTime;
}
```

## Core Types

### Workspace
```typescript
{
  id: string;
  name: string;
  slug: string;
  settings: WorkspaceSettings;
  created_at: DateTime;
  updated_at: DateTime;
}
```

### WorkspaceMember
```typescript
{
  id: string;
  user_id: string;          // References auth.users(id)
  workspace_id: string;
  role: 'admin' | 'agent';
  permissions: string[];
  joined_at: DateTime;
}
```

### Ticket
```typescript
{
  id: string;
  workspace_id: string;
  customer_email: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to_id?: string;  // References auth.users(id)
  category?: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: DateTime;
  updated_at: DateTime;
}
```

### TicketStatus
```typescript
type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
```

### TicketPriority
```typescript
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
```

### Conversation
```typescript
{
  id: string;
  ticket_id: string;
  messages: Message[];
  participants: string[];    // Array of auth.users(id)
  status: 'active' | 'closed';
  created_at: DateTime;
  updated_at: DateTime;
}
```

### Message
```typescript
{
  id: string;
  conversation_id: string;
  sender_id: string;        // References auth.users(id)
  content: string;
  type: 'text' | 'system' | 'ai';
  metadata: Record<string, any>;
  created_at: DateTime;
}
```

### Article
```typescript
{
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  slug: string;
  category_id: string;
  tags: string[];
  author_id: string;        // References auth.users(id)
  status: 'draft' | 'published' | 'internal';
  created_at: DateTime;
  updated_at: DateTime;
}
```

### Document
```typescript
{
  id: string;
  workspace_id: string;
  title: string;
  file_name: string;
  file_path: string;        // Storage path in Supabase bucket
  file_type: string;
  category_id: string;
  tags: string[];
  uploader_id: string;      // References auth.users(id)
  status: 'draft' | 'published' | 'internal';
  created_at: DateTime;
}
```

### Category
```typescript
{
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  parent_id?: string;
  order: number;
}
```

## Supabase Schema Notes
- All tables inherit from auth.users for user management
- Profile table uses Supabase's recommended public.profiles pattern
- Use snake_case for column names (Supabase convention)
- Enable row level security (RLS) policies for multi-tenant security
- Enable real-time for tickets, conversations, and messages
- Required indexes:
  - workspace_id on all tables
  - email search for customer lookups
  - slug lookups for workspaces and articles
  - status fields for filtering
- Use Supabase Storage buckets for document files
- Implement soft deletes using deleted_at timestamp