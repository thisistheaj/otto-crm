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

## 3. Ticket Detail View (`support.$workspaceSlug.ticket.$ticketId.tsx`)
- [ ] Create ticket detail layout
- [ ] Implement loader for ticket data
  - [ ] Validate workspace exists
  - [ ] Validate ticket exists
- [ ] Display ticket status and details
- [ ] Add chat access button/link
- [ ] Handle invalid ticket IDs
- [ ] Style with shadcn components

## 4. Ticket Chat Interface (`support.$workspaceSlug.ticket.$ticketId.chat.tsx`)
- [x] Build real-time chat interface
- [x] Implement chat loader for history
- [ ] Configure Supabase real-time permissions for chat room
- [x] Create message input component
- [ ] Add typing indicators
- [x] Handle message sending/receiving
- [x] Display ticket context in chat
- [x] Add loading states and error handling

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

## Notes
- Focus on minimal viable implementation
- Ensure proper real-time updates
- Maintain consistent UI/UX with shadcn
- Add appropriate TypeScript types 