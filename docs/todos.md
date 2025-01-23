# Support Ticket and Chat Implementation Plan

## 1. Workspace Support Portal (`support.$workspaceSlug.tsx`)
- [x] Create layout with navigation
- [x] Add workspace validation and data loading
- [x] Add error boundary for invalid workspaces
- [x] Style with shadcn components

## 2. New Ticket Creation (`support.$workspaceSlug.ticket.new.tsx`)
- [x] Build ticket creation form using shadcn components
  - [x] Subject field
  - [x] Description field
  - [x] Email field with validation
- [x] Implement ticket creation action
  - [x] Create ticket record (priority defaults to 'medium')
  - [x] Initialize associated chat room
  - [x] Generate unique ticket ID
- [x] Add form validation
  - [x] Required email validation
  - [x] Required subject/description
- [x] Implement redirect to ticket detail/chat page
- [x] Add loading states and error handling

## 3. Ticket Detail View (`support.$workspaceSlug.ticket.$ticketId._index.tsx`)
- [x] Create ticket detail layout
- [x] Implement loader for ticket data
  - [x] Validate workspace exists
  - [x] Validate ticket exists
- [x] Display ticket status and details
- [x] Add chat access button/link
- [x] Handle invalid ticket IDs
- [x] Style with shadcn components

## 4. Ticket Chat Interface (`support.$workspaceSlug.ticket.$ticketId.chat.tsx`)
- [x] Build real-time chat interface
- [x] Implement chat loader for history
- [x] Configure Supabase real-time permissions for chat room
- [x] Create message input component
- [x] Handle message sending/receiving
- [x] Display ticket context in chat
- [x] Add loading states and error handling

## 5. Agent Interface Implementation

### Dashboard Integration (`workspace.$workspaceId.tsx`)
- [x] Add tickets overview section to dashboard
  - [x] Show recent/urgent tickets (limit 5)
  - [x] Display key ticket info (subject, status, priority)
  - [x] Add "View All" link to full ticket list
  - [x] Add quick status updates via server action

### Ticket Management (`workspace.$workspaceId.tickets.tsx`)
- [x] Create ticket list route
  - [x] Implement loader for server-side ticket fetching
  - [x] Add pagination and basic filters
  - [x] Create action for status updates
- [x] Build data table with columns:
  - [x] Customer email
  - [x] Subject
  - [x] Status (with dropdown to update)
  - [x] Priority
  - [x] Created at
  - [x] Actions (link to chat)
- [x] Add server-side actions for ticket updates
  - [x] Status update action
  - [x] Priority update action
- [x] Add navigation to existing chat interface

## Database Changes
- [x] Add tickets table
  - [x] ticket_id (UUID)
  - [x] workspace_id (FK)
  - [x] subject
  - [x] description
  - [x] status
  - [x] priority (default: 'medium')
  - [x] created_at
  - [x] chat_room_id (FK)
  - [x] email

- [x] Add chat_rooms table
  - [x] room_id (UUID)
  - [x] ticket_id (FK)
  - [x] status
  - [x] created_at

- [x] Add messages table
  - [x] message_id (UUID)
  - [x] room_id (FK)
  - [x] content
  - [x] sender_type (enum: 'customer', 'agent')
  - [x] created_at

## Database Updates Needed
- [x] Add server-side ticket management functions in `app/models/ticket.server.ts`:
  - [x] getWorkspaceTickets(workspaceId, filters)
  - [x] updateTicketStatus(ticketId, status)
  - [x] updateTicketPriority(ticketId, priority)

## Notes
- [x] Focus on minimal viable implementation
- [x] Maintain consistent UI/UX with shadcn
- [x] Add appropriate TypeScript types
- [x] Use server-side data access through Remix loaders/actions
- [x] Keep dashboard view lightweight and link to full management page 
- [x] move any applicable ticket logic from /support to app/models/ticket.server.ts 
