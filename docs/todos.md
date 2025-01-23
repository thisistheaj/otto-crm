# Knowledge Base Implementation Plan

## 1. Database Setup
- [x] Verify existing tables match datatypes.md schema
  - articles
  - documents
- [x] Add necessary indexes for performance
- [x] Set up RLS policies for workspace-based access

## 2. Knowledge Base Overview (`workspace.$workspaceId.kb.tsx`)
- [x] Create unified list view for all content
  - [x] Data table showing:
    - [x] Type (article/document)
    - [x] Title
    - [x] Status
    - [x] Updated date
  - [x] Basic filters and search
- [x] Add action buttons:
  - [x] "New Article" button
  - [x] "Upload Document" button
- [x] Implement delete actions

## 3. Article Creation/Editing (`workspace.$workspaceId.kb.article.$articleId.tsx`)
- [ ] Build article editor
  - [ ] Title field
  - [ ] Content editor
  - [ ] Tag input
  - [ ] Draft/Publish toggle
- [ ] Add save/publish actions
- [ ] Handle validation and errors

## 4. Document Upload Dialog
- [x] Create upload dialog component
  - [x] File upload input
  - [x] Title field
  - [x] Tag input
  - [x] Status toggle
- [x] Reuse file upload logic from protected.tsx
- [x] Add validation and error handling

## 5. Server-Side Implementation
- [x] Create kb.server.ts for shared logic
- [x] Implement article CRUD operations
- [x] Add document upload/management functions

## Notes
- Single unified view for all knowledge base content
- Simple tag-based organization
- Focus on core content management first
