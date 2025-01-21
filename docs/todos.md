# Workspace Management Implementation Plan

## 1. Initial Workspace Selection/Landing Page (`_index.tsx`)
- [ ] Implement loader to fetch user's workspaces
- [ ] Check user's profile completion status
- [ ] Build workspace selection UI
  - [ ] List of user's workspaces
  - [ ] Create workspace button
  - [ ] Join workspace button
- [ ] Add navigation logic to create/join pages
- [ ] Implement workspace selection handler

## 2. Profile Completion Dialog Component
- [ ] Create reusable dialog component
- [ ] Add form for full name and avatar
- [ ] Implement avatar upload
- [ ] Add profile update mutation
- [ ] Add validation
- [ ] Style with shadcn components

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