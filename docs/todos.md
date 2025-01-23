# Settings Implementation Plan

## 1. Routes Setup
- [x] Create team settings route (`workspace.$id.team.tsx`)
  - [x] Add "Team" link to workspace sidebar
- [x] Create user settings route (`workspace.$id.settings.tsx`)
  - [x] Update "Settings" link in workspace sidebar

## 2. Team Page (`workspace.$id.team.tsx`)
### Features
- [x] Workspace Management
  - [x] Display workspace info and ID (for invites)
  - [x] Copy workspace ID button
  - [x] Add workspace name editing
  - [x] Add workspace deletion with confirmation
- [x] Member Management
  - [x] List all workspace members
  - [x] Update member roles (admin/agent)
  - [x] Remove members
  - [x] Show member status (online/offline)

## 3. Settings Page (`workspace.$id.settings.tsx`)
### Features
- [x] Profile Management
  - [x] Edit name and avatar (reuse components from _index.tsx)
  - [x] Update email preferences (removed as per request)
- [x] Availability Settings
  - [x] Simple online/offline toggle
- [x] Workspace Quick Switcher
  - [x] List joined workspaces
  - [x] Quick workspace switching UI

## 4. Components to Create
- [x] `components/settings/member-list.tsx`
  - [x] Member table with role selector
  - [x] Remove member button
  - [x] Status indicator
- [x] `components/settings/workspace-info.tsx`
  - [x] Workspace name editor
  - [x] Copy workspace ID button
  - [x] Delete workspace button
- [x] `components/settings/workspace-delete-dialog.tsx` (integrated into workspace-info)
  - [x] Confirmation dialog
  - [x] Name confirmation input
- [x] `components/settings/availability-toggle.tsx` (integrated into settings page)
  - [x] Simple online/offline toggle

## 5. Server-Side Implementation
- [x] Update `models/workspace.server.ts`
  - [x] Add workspace update/delete functions
  - [x] Add member role management functions
- [x] Update `models/profile.server.ts`
  - [x] Add availability toggle function

## Implementation Order
1. ✅ Update workspace sidebar with new navigation
2. ✅ User settings page (reusing _index.tsx components)
3. ✅ Team page with member management
4. ✅ Workspace management (name edit, delete)
5. ✅ Simple availability toggle

## Notes
- ✅ No database changes required
- ✅ No real-time updates needed
- ✅ Reuse profile components from _index.tsx
- ✅ Simple invite system using workspace ID
- ✅ Split into two distinct pages instead of tabs
