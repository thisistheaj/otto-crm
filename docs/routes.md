# Project Structure

```
.
├── app/
│   ├── components/
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── knowledge/
│   │   ├── shared/
│   │   └── tickets/
│   ├── lib/
│   │   ├── ai/
│   │   ├── supabase/
│   │   └── utils/
│   ├── models/
│   │   ├── article.server.ts
│   │   ├── conversation.server.ts
│   │   ├── document.server.ts
│   │   ├── message.server.ts
│   │   ├── profile.server.ts
│   │   ├── ticket.server.ts
│   │   ├── types.ts
│   │   ├── workspace-member.server.ts
│   │   └── workspace.server.ts
│   ├── routes/
│   │   ├── _index.tsx                    # Workspace selection/creation
│   │   ├── api.ai.analyze.ts
│   │   ├── api.ai.respond.ts
│   │   ├── api.ai.train.ts
│   │   ├── api.chat.$conversationId.ts
│   │   ├── api.webhooks.supabase.ts
│   │   ├── auth.login.tsx
│   │   ├── auth.logout.tsx
│   │   ├── auth.signup.tsx
│   │   ├── support.$workspaceSlug.tsx    # Customer support portal
│   │   ├── support.$workspaceSlug.knowledge.tsx
│   │   ├── support.$workspaceSlug.ticket.new.tsx
│   │   ├── support.$workspaceSlug.ticket.$ticketId.tsx
│   │   ├── support.$workspaceSlug.ticket.$ticketId.chat.tsx
│   │   ├── support.tsx                   # Support portal workspace selector
│   │   ├── workspace.$workspaceId.agents.tsx
│   │   ├── workspace.$workspaceId.analytics.tsx
│   │   ├── workspace.$workspaceId.chat.$conversationId.tsx
│   │   ├── workspace.$workspaceId.chat.tsx
│   │   ├── workspace.$workspaceId.knowledge.articles.$articleId.tsx
│   │   ├── workspace.$workspaceId.knowledge.articles.new.tsx
│   │   ├── workspace.$workspaceId.knowledge.articles.tsx
│   │   ├── workspace.$workspaceId.knowledge.documents.new.tsx
│   │   ├── workspace.$workspaceId.knowledge.documents.tsx
│   │   ├── workspace.$workspaceId.knowledge.tsx
│   │   ├── workspace.$workspaceId.routing.tsx
│   │   ├── workspace.$workspaceId.settings.tsx
│   │   ├── workspace.$workspaceId.tickets.$ticketId.tsx
│   │   ├── workspace.$workspaceId.tickets.tsx
│   │   ├── workspace.$workspaceId.tsx    # Workspace dashboard
│   │   ├── workspace.join.tsx
│   │   └── workspace.new.tsx
│   ├── styles/
│   ├── entry.client.tsx
│   ├── entry.server.tsx
│   └── root.tsx
├── public/
├── supabase/
│   └── migrations/
├── tests/
├── package.json
├── remix.config.js
├── supabase.config.json
└── tailwind.config.js
```

## Route Patterns

### Public Routes
- `/` - Workspace selection
- `/auth.*` - Authentication flows
- `/support.$workspaceSlug.*` - Customer-facing support portal
- `/workspace.join` - Join workspace by invite
- `/workspace.new` - Create new workspace

### Protected Routes
All routes under `/workspace.$workspaceId.*` require authentication and workspace membership:
- Dashboard
- Ticket management
- Chat system
- Knowledge base
- Settings & configuration

### API Routes
- `/api.ai.*` - AI functionality endpoints
- `/api.chat.*` - Real-time chat endpoints
- `/api.webhooks.*` - External service webhooks

## Notes
- Uses Remix flat routes with dot convention
- API routes prefixed with `api.`
- Customer portal under `support.`
- Admin/agent portal under `workspace.`
- Server models contain database access logic
- Types shared between client and server in `types.ts`