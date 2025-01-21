# Workspace Management Implementation Plan

## 1. Initial Workspace Selection/Landing Page (`_index.tsx`)
- [x] Implement loader to fetch user's workspaces
- [x] Check user's profile completion status
- [x] Build workspace selection UI
  - [x] List of user's workspaces
  - [x] Create workspace button
  - [x] Join workspace button
- [x] Add navigation logic to create/join pages
- [ ] Implement workspace selection handler

## 2. Profile Completion Dialog Component
- [x] Create reusable dialog component
- [x] Add form for full name and avatar
- [x] Implement avatar upload
- [x] Add profile update mutation
- [x] Add validation
- [x] Style with shadcn components

## 3. Workspace Creation (`workspace.new.tsx`)
- [ ] Create workspace form
- [ ] Implement workspace creation mutation
- [ ] Add automatic admin role assignment
- [ ] Add validation
- [ ] Implement redirect to workspace dashboard
- [ ] Add error handling

## 4. Workspace Join (`workspace.join.tsx`)
- [ ] Implement invite link handling
- [ ] Create workspace member mutation
- [ ] Add validation for invite
- [ ] Implement redirect to workspace
- [ ] Add error handling

## Notes
- Minimize database schema changes
- Reuse existing components where possible
- Follow shadcn design patterns
- Ensure proper error handling and loading states
- Add appropriate TypeScript types 