# JU Activity Hub — Folder Structure

## Root Files (src/)

| File | Purpose |
|------|---------|
| `App.tsx` | Root React component — defines all routes using React Router v6, wraps with providers (Auth, Activity, Theme, Google OAuth), renders role-based page routing |
| `App.css` | Global app-level CSS overrides |
| `index.css` | Tailwind directives (`@tailwind base; components; utilities`) + custom CSS variables for theming |
| `main.tsx` | Entry point — mounts React root, wraps with ThemeProvider and optional GoogleOAuthProvider |
| `vite-env.d.ts` | Vite client type declarations |

---

## components/ — Shared UI Components

### Root-level

| File | Purpose |
|------|---------|
| `ErrorBoundary.tsx` | React error boundary — catches render errors and shows fallback UI with retry button |
| `ConnectionError.tsx` | Full-screen connection error message when API is unreachable |
| `BrandLogo.tsx` | JU Activity Hub logo/branding element with text |

### blocks/ — Layout Building Blocks

| File | Purpose |
|------|---------|
| `AppHeader.tsx` | Top navigation header with branding, user menu, notifications bell icon |
| `chat-template.tsx` | Inbox-style chat UI template with sidebar conversation list + main chat panel |
| `sidebar.tsx` | Application sidebar wrapper using shadcn sidebar primitives |

### chat/ — Chat System Components

| File | Purpose |
|------|---------|
| `ChatHeader.tsx` | Chat room header — activity title, member count, back and members toggle buttons |
| `ChatInput.tsx` | Message input area — textarea with emoji picker, file upload, voice recording |
| `CommunicationsHub.tsx` | Slide-out chat widget for DashboardLayout providing quick mock direct messaging |
| `MembersPanel.tsx` | Slide-out panel listing chat room members with role badges |
| `MessageBubble.tsx` | Individual message display — text content, reactions bar, reply chain, edit/delete, copy, media attachments |
| `WaveformVisualizer.tsx` | Audio waveform animation component displayed during voice recording |

### layout/ — App Layout

| File | Purpose |
|------|---------|
| `DashboardLayout.tsx` | Main application shell — sidebar navigation + header + scrollable content area |
| `SidebarNav.tsx` | Role-based sidebar navigation rendering links for admin, coordinator, or student sections |

### providers/ — React Context Providers

| File | Purpose |
|------|---------|
| `theme-provider.tsx` | Wraps `next-themes` ThemeProvider for dark/light mode support |

### routes/ — Route Guards

| File | Purpose |
|------|---------|
| `ProtectedRoute.tsx` | Route guard — redirects unauthenticated users to `/login`, checks role permissions |

### shared/

| File | Purpose |
|------|---------|
| `ActivitiesCalendar.tsx` | Full calendar view of activities with filtering (date range, category, status) |

### ui/ — shadcn/ui Component Primitives

All are Radix UI-based reusable primitive components with Tailwind styling.

| File | Status | Purpose |
|------|--------|---------|
| `alert.tsx` | Used | Alert banners for inline messages (success, error, warning, info) |
| `alert-dialog.tsx` | Used | Confirmation modals with cancel/confirm actions |
| `avatar.tsx` | Used | User avatar image with fallback initials |
| `badge.tsx` | Used | Status/category badges (admin/coordinator/student, approved/rejected, etc.) |
| `button.tsx` | Used | Primary, secondary, ghost, outline, destructive button variants |
| `card.tsx` | Used | Content cards with optional header, footer, title, description |
| `checkbox.tsx` | Used | Checkbox input for forms |
| `dialog.tsx` | Used | Modal dialogs with overlay, close button, and focus trap |
| `dropdown-menu.tsx` | Used | Dropdown menus with items, separators, checkboxes |
| `input.tsx` | Used | Text input fields with label and error state |
| `label.tsx` | Used | Form field labels |
| `loading.tsx` | Used | Loading spinner/state indicator (custom component) |
| `popover.tsx` | Used | Popover overlays for menus, pickers |
| `progress.tsx` | Used | Progress bars |
| `resizable.tsx` | Used | Resizable panel groups |
| `scroll-area.tsx` | Used | Custom scrollable container with styled scrollbar |
| `select.tsx` | Used | Dropdown select with search and groups |
| `separator.tsx` | Used | Horizontal/vertical visual dividers |
| `sheet.tsx` | Used | Slide-out panels from left/right edges |
| `sidebar.tsx` | Used | Full sidebar implementation (~38 sub-components: Sidebar, SidebarContent, SidebarMenu, etc.) |
| `skeleton.tsx` | Used | Loading skeleton placeholders |
| `sonner.tsx` | Used | Sonner toast notification integration |
| `switch.tsx` | Used | Toggle switches |
| `table.tsx` | Used | Data tables with header, body, row, cell |
| `tabs.tsx` | Used | Tabbed interfaces |
| `textarea.tsx` | Used | Multi-line text input |
| `toast.tsx` | Used | Toast notification primitives (ToastProvider, ToastViewport, Toast, etc.) |
| `toaster.tsx` | Used | Toast notification renderer mounted in app root |
| `tooltip.tsx` | Used | Hover tooltips with delay |
| `use-toast.ts` | Used | Re-exports from `@/hooks/use-toast` for codegen compatibility |

---

## constants/ — App Constants

| File | Purpose |
|------|---------|
| `emojis.ts` | `QUICK_REACTIONS` (8 emojis for message reactions) and `EMOJI_PICKER` (~140 emojis for picker grid) |

---

## contexts/ — React State Management

| File | Purpose |
|------|---------|
| `ActivityContext.tsx` | Central data store — fetches activities, applications, notifications, attendance from backend; subscribes to SignalR hub for real-time updates; provides loading/error states |
| `AuthContext.tsx` | Authentication state — current user session, login/logout actions, profile updates, admin user CRUD operations |

---

## data/ — Mock Data

| File | Purpose |
|------|---------|
| `mockData.ts` | Mock data arrays (`mockActivities`, `mockApplications`, `mockNotifications`, etc.) used as fallback data when backend is unavailable; also exports type interfaces |

---

## hooks/ — Custom React Hooks

| File | Purpose |
|------|---------|
| `use-mobile.tsx` | Detects mobile viewport width using `matchMedia` for responsive sidebar collapse |
| `use-toast.ts` | Global toast notification system — exports standalone `toast()` function and `useToast()` hook with reducer-based state |

---

## lib/ — Utilities & API Layer

| File | Purpose |
|------|---------|
| `api.ts` | Full API client — generic `fetchApi<T>()` wrapper with auth headers + 9 endpoint modules (authApi, usersApi, activitiesApi, applicationsApi, notificationsApi, attendanceApi, auditLogsApi, messagesApi, categoriesApi); each method typed with JSDoc |
| `format.ts` | Date formatting utilities — `formatTime`, `formatRelativeTime`, `formatDateLabel`, `groupByDate` for chat timestamps |
| `reportUtils.ts` | Report generation — exports `exportToPDF()` and `exportToCSV()` for admin reporting |
| `utils.ts` | Exports `cn()` helper function merging Tailwind class names via `clsx` + `tailwind-merge` |

---

## pages/ — Route Pages

### Root Pages

| File | Route | Purpose |
|------|-------|---------|
| `SplashScreen.tsx` | `/` | Animated landing/splash page with app branding |
| `LoginScreen.tsx` | `/login` | Email/password login with email domain validation, password visibility toggle, "Remember me", Google OAuth button |
| `RegisterScreen.tsx` | `/register` | Multi-step registration: personal info → verification code → confirmation |
| `ForgotPasswordScreen.tsx` | `/forgot-password` | Email input to request password reset link |
| `ChangePasswordScreen.tsx` | `/change-password` | Authenticated password change form (current + new password) |
| `ProfileScreen.tsx` | `/*/profile` | User profile editing with tabs: personal info, avatar upload, password change |
| `AllActivitiesCalendar.tsx` | `/admin/calendar` | Full calendar page with all activities, supports date/category/status filtering |
| `NotFound.tsx` | `*` | 404 page with "back to home" link |

### admin/ — Admin Role Pages

| File | Route | Purpose |
|------|-------|---------|
| `AdminDashboard.tsx` | `/admin/dashboard` | KPI dashboard — user stats, total activities, application counts, recent activity charts |
| `AdminActivities.tsx` | `/admin/activities` | CRUD table listing all activities — search, filter, edit, delete |
| `AdminCreateActivity.tsx` | `/admin/activities/new` | Form to create a new activity with all fields |
| `AdminApplications.tsx` | `/admin/applications` | Student application review table with approve/reject actions |
| `AdminUsers.tsx` | `/admin/users` | User listing with search and role filtering |
| `AdminReports.tsx` | `/admin/reports` | Tabbed reporting — summary stats, detailed logs, PDF/CSV export |
| `AdminNotifications.tsx` | `/admin/notifications` | Send system-wide notifications; view notification history |
| `AdminLogs.tsx` | `/admin/logs` | Audit log viewer with date range and action type filters |
| `ManageRoles.tsx` | `/admin/manage-roles` | Assign roles to users |
| `ManageUsers.tsx` | `/admin/manage-users` | Full user CRUD — create, edit, delete, toggle active status |
| `MonitorActivities.tsx` | `/admin/monitor` | Live activity monitoring dashboard with real-time updates |
| `SystemLogs.tsx` | `/admin/system-logs` | System-wide activity log with pagination |

### coordinator/ — Coordinator Role Pages

| File | Route | Purpose |
|------|-------|---------|
| `CoordinatorDashboard.tsx` | `/coordinator/dashboard` | Overview of assigned activities, application stats, upcoming events |
| `CoordinatorActivities.tsx` | `/coordinator/activities` | List of activities assigned to this coordinator |
| `CreateActivity.tsx` | `/coordinator/activities/new` | Create new activity form |
| `ManageActivities.tsx` | `/coordinator/activities/manage` | Edit and delete assigned activities |
| `CoordinatorApplications.tsx` | `/coordinator/applications` | Review applications for assigned activities |
| `ApproveRejectApplication.tsx` | — | Individual application approve/reject with feedback |
| `AttendanceManagement.tsx` | `/coordinator/attendance/manage` | Mark attendance for specific activities |
| `CoordinatorAttendance.tsx` | `/coordinator/attendance` | Attendance overview across activities |
| `CoordinatorNotifications.tsx` | `/coordinator/notifications` | Notification inbox |

### student/ — Student Role Pages

| File | Route | Purpose |
|------|-------|---------|
| `StudentDashboard.tsx` | `/student/dashboard` | Student home — enrolled activities, upcoming events, pending applications |
| `StudentActivities.tsx` | `/student/activities` | Browse all available activities with filters, apply button |
| `ActivityDetails.tsx` | `/student/activities/:id` | Full activity details view — description, schedule, documents, apply |
| `StudentApplications.tsx` | `/student/applications` | Track submitted application statuses |
| `StudentCalendar.tsx` | `/student/calendar` | Calendar view of enrolled activities |
| `StudentNotifications.tsx` | `/student/notifications` | Notification inbox |

### chat/ — Chat Pages

| File | Route | Purpose |
|------|-------|---------|
| `ChatListPage.tsx` | `/*/chat` | Chat directory — lists all activity chats with last message preview |
| `ChatRoomPage.tsx` | `/*/chat/:activityId` | Full chat room — paginated message history, real-time messaging, reactions, file uploads, voice recording |
| `ChatRoomSkeleton.tsx` | — | Loading skeleton for chat room (placeholder while fetching) |
| `ChatTemplateDemo.tsx` | `/admin/chat-template-demo` | Chat template demo page for preview |

---

## services/ — Business Logic

| File | Purpose |
|------|---------|
| `userService.ts` | Thin wrapper around `usersApi` — exports `getTotalUsers()` and `getUserStats()` consumed by AdminDashboard |

---

## types/ — TypeScript Type Definitions

| File | Purpose |
|------|---------|
| `api.ts` | All API response/request types — `User`, `Activity`, `Application`, `Notification`, `Attendance`, `AuditLog`, `MessageResponse`, `AuthResponse`, `LoginRequest`, `RegisterRequest`, and 20+ more |
| `chat.ts` | Chat-specific types — `ChatMessage`, `Member`, `ReactionEntry`, `ReplyTo`, `ChatMessageStatus` |

---

## Folder Summary

| Folder | File Count | Purpose |
|--------|-----------|---------|
| `components/` | 57 | All shared UI components (chat, layout, UI primitives) |
| `constants/` | 1 | App-wide constants (emoji lists) |
| `contexts/` | 2 | React context providers for global state management |
| `data/` | 1 | Mock data and fallback types |
| `hooks/` | 2 | Custom React hooks |
| `lib/` | 4 | API client, formatting utilities, report generators |
| `pages/` | 40 | All route pages organized by role (admin/coordinator/student/chat) |
| `services/` | 1 | Business logic service layer |
| `types/` | 2 | TypeScript type definitions |

**Total: ~110 source files** covering authentication, role-based dashboards, activity/applications/attendance management, real-time chat, reporting, and a complete shadcn/ui component library — built as a single-page React + TypeScript + Vite + Tailwind CSS application.
