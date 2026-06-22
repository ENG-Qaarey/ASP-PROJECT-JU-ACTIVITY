# JU Activity Hub — Frontend Structure

```

ju-activity/
|
+-- .env                          Environment variables (local)
+-- .env.local                    Environment variables (local override)
+-- .gitignore                    Git ignore rules
+-- bun.lockb                     Bun package lock
+-- components.json               shadcn/ui component configuration
+-- eslint.config.js              ESLint configuration
+-- index.html                    Vite entry HTML
+-- package-lock.json             npm package lock
+-- package.json                  Dependencies and scripts
+-- postcss.config.js             PostCSS configuration
+-- README.md                     Project overview
+-- tailwind.config.ts            Tailwind CSS theme configuration
+-- tsconfig.json                 Root TypeScript configuration
+-- tsconfig.app.json             TypeScript config for app source
+-- tsconfig.node.json            TypeScript config for Node tooling
+-- vercel.json                   Vercel deployment configuration
+-- versions.json                 Dependency version tracking
+-- vite.config.ts                Vite bundler configuration
|
+-- public/                       Static assets (served as-is)
|   +-- dev-muscab.svg            Dev mascot SVG
|   +-- ju-icon.svg               JU icon
|   +-- placeholder.svg           Placeholder image
|   +-- robots.txt                Search engine crawl rules
|
+-- dist/                         Production build output
|
+-- node_modules/                 Installed npm dependencies
|
+-- src/                          Application source code
    |
    +-- main.tsx                  App entry point; renders root with providers
    +-- App.tsx                   Root component; sets up routing and top-level providers
    +-- App.css                   Root app styles
    +-- index.css                 Global Tailwind/base styles
    +-- vite-env.d.ts             Vite environment type declarations
    |
    +-- components/               Reusable UI components
    |   +-- AppSidebar.tsx        Main sidebar navigation component
    |   +-- BrandLogo.tsx         Brand logo display
    |   +-- ConnectionError.tsx   Backend connection error banner
    |   +-- ErrorBoundary.tsx     React error boundary fallback
    |   +-- NavMain.tsx           Main navigation items
    |   +-- NavSecondary.tsx      Secondary navigation items
    |   +-- NavUser.tsx           User avatar/dropdown in sidebar
    |   +-- TeamSwitcher.tsx      Team/role switcher
    |   |
    |   +-- admin/                Admin-specific components
    |   |   +-- Overview.tsx          Admin dashboard overview widget
    |   |   +-- RecentActivity.tsx    Recent activity feed for admin
    |   |
    |   +-- blocks/               Page block templates
    |   |   +-- ChatTemplate.tsx      Chat page layout template
    |   |
    |   +-- chat/                 Chat-related components
    |   |   +-- ChatHeader.tsx        Chat room header
    |   |   +-- ChatInput.tsx         Message input bar
    |   |   +-- ChatRoomSkeleton.tsx  Chat room loading skeleton
    |   |   +-- ChatRoomView.tsx      Main chat room view
    |   |   +-- CommunicationsHub.tsx Central hub for all communications
    |   |   +-- MembersPanel.tsx      Chat members sidebar panel
    |   |   +-- MessageBubble.tsx     Individual message bubble
    |   |   +-- WaveformVisualizer.tsx Audio waveform visualization
    |   |
    |   +-- coordinator/          Coordinator-specific components
    |   |   +-- CoordinatorOverview.tsx  Coordinator dashboard overview
    |   |
    |   +-- layout/               Layout components
    |   |   +-- DashboardLayout.tsx    Main dashboard layout shell
    |   |
    |   +-- providers/            React context providers
    |   |   +-- theme-provider.tsx     Theme (light/dark) provider
    |   |
    |   +-- routes/               Route guard components
    |   |   +-- ProtectedRoute.tsx     Role-based route protection
    |   |
    |   +-- shared/               Shared components
    |   |   +-- ActivitiesCalendar.tsx  Shared calendar view component
    |   |
    |   +-- student/              Student-specific components
    |   |   +-- StudentOverview.tsx     Student dashboard overview
    |   |
    |   +-- ui/                   shadcn/ui primitives
    |       +-- alert-dialog.tsx  Alert dialog modal
    |       +-- alert.tsx         Inline alert banners
    |       +-- avatar.tsx        User avatar display
    |       +-- badge.tsx         Status/count badges
    |       +-- button.tsx        Button component
    |       +-- card.tsx          Card container
    |       +-- checkbox.tsx      Checkbox input
    |       +-- collapsible.tsx   Collapsible panel
    |       +-- dialog.tsx        Modal dialog
    |       +-- dropdown-menu.tsx Dropdown menu
    |       +-- input.tsx         Text input
    |       +-- label.tsx         Form label
    |       +-- loading.tsx       Loading spinner
    |       +-- popover.tsx       Popover overlay
    |       +-- progress.tsx      Progress bar
    |       +-- resizable.tsx     Resizable panels
    |       +-- scroll-area.tsx   Scrollable area
    |       +-- select.tsx        Select dropdown
    |       +-- separator.tsx     Visual separator
    |       +-- sheet.tsx         Slide-in sheet
    |       +-- sidebar.tsx       Sidebar layout
    |       +-- skeleton.tsx      Loading skeleton
    |       +-- sonner.tsx        Sonner toast integration
    |       +-- switch.tsx        Toggle switch
    |       +-- table.tsx         Data table
    |       +-- tabs.tsx          Tab container
    |       +-- textarea.tsx      Multi-line text input
    |       +-- toast.tsx         Toast notification hook
    |       +-- toaster.tsx       Toast renderer
    |       +-- tooltip.tsx       Tooltip
    |
    +-- constants/                Application constants
    |   +-- emojis.ts                 Emoji reaction list for chat
    |
    +-- contexts/                 React contexts (state management)
    |   +-- AuthContext.tsx            Authentication state & user management
    |   +-- ActivityContext.tsx        Central data store (activities, apps, notifications)
    |
    +-- hooks/                    Custom React hooks
    |   +-- use-mobile.tsx            Responsive/mobile detection hook
    |   +-- use-toast.ts              Toast notification hook
    |
    +-- lib/                      Utility libraries
    |   +-- api.ts                    Complete API client (fetch wrapper, all endpoints)
    |   +-- format.ts                 Date/time formatting helpers
    |   +-- reportUtils.ts            Report generation (CSV, PDF, quarterly reports)
    |   +-- utils.ts                  Tailwind class merging utility (cn)
    |
    +-- pages/                    Page-level components (one per route)
    |   +-- AllActivitiesCalendar.tsx  Global calendar of all activities
    |   +-- ChangePasswordScreen.tsx   Password change form
    |   +-- ForgotPasswordScreen.tsx   Password reset request form
    |   +-- LoginScreen.tsx            Login page
    |   +-- NotFound.tsx               404 page
    |   +-- ProfileScreen.tsx          User profile editor
    |   +-- RegisterScreen.tsx         Registration page
    |   +-- SplashScreen.tsx           Landing/splash page
    |   |
    |   +-- admin/                 Admin role pages
    |   |   +-- AdminActivities.tsx         Browse all activities
    |   |   +-- AdminApplications.tsx       View/manage all applications
    |   |   +-- AdminCreateActivity.tsx     Create new activity
    |   |   +-- AdminDashboard.tsx          Admin home dashboard
    |   |   +-- AdminLogs.tsx               Admin action logs
    |   |   +-- AdminNotifications.tsx      View all notifications
    |   |   +-- AdminReports.tsx            Generate reports
    |   |   +-- AdminUsers.tsx              Manage system users
    |   |   +-- ManageRoles.tsx             Assign user roles
    |   |   +-- ManageUsers.tsx             User CRUD management
    |   |   +-- MonitorActivities.tsx       Activity monitoring dashboard
    |   |   +-- SystemLogs.tsx              System-wide audit logs
    |   |
    |   +-- chat/                  Chat pages
    |   |   +-- UnifiedChatPage.tsx         Unified chat interface
    |   |
    |   +-- coordinator/           Coordinator role pages
    |   |   +-- AttendanceManagement.tsx    Mark/track attendance
    |   |   +-- CoordinatorApplications.tsx Manage applications for own activities
    |   |   +-- CoordinatorDashboard.tsx    Coordinator home dashboard
    |   |   +-- CoordinatorNotifications.tsx View notifications
    |   |   +-- CreateActivity.tsx          Create/edit activity (mock)
    |   |   +-- ManageActivities.tsx        Manage own activities
    |   |
    |   +-- student/               Student role pages
    |       +-- ActivityDetails.tsx         Activity detail view
    |       +-- StudentActivities.tsx       Browse available activities
    |       +-- StudentApplications.tsx     View own applications
    |       +-- StudentCalendar.tsx         Personal calendar
    |       +-- StudentDashboard.tsx        Student home dashboard
    |       +-- StudentNotifications.tsx    View own notifications
    |
    +-- services/                 Service layer
    |   +-- userService.ts            User statistics service
    |
    +-- types/                    TypeScript type definitions
        +-- api.ts                   API response/request types
        +-- chat.ts                  Chat message and member types

```

## Overview

**JU Activity Hub** is a full-stack activity management platform built with React + TypeScript + Vite + Tailwind CSS (frontend) and ASP.NET Core (backend). The frontend (`ju-activity/`) provides a role-based dashboard interface for three user types:

- **Student** — Browse activities, apply, track attendance, chat, view calendar
- **Coordinator** — Manage activities, review applications, mark attendance
- **Admin** — Full system control: users, activities, roles, reports, logs

### Key Technologies

| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework |
| Vite 5 | Build tool / dev server |
| Tailwind CSS 3 | Utility-first styling |
| shadcn/ui | Accessible UI primitives |
| React Router v6 | Client-side routing |
| TanStack Query | Server state / caching |
| SignalR (@microsoft/signalr) | Real-time notifications & chat |
| Zod | Schema validation |
| Recharts | Dashboard charts |
| Framer Motion | Animations |
| react-hook-form | Form handling |

### Routing Structure

Routes are organized by role under the root `App.tsx`:

| Path | Role | Description |
|------|------|-------------|
| `/` | Public | Splash/Landing page |
| `/login`, `/register` | Public | Authentication |
| `/student/*` | Student | Student dashboard, activities, applications, chat, calendar |
| `/coordinator/*` | Coordinator | Dashboard, activities, applications, attendance, chat |
| `/admin/*` | Admin | Dashboard, users, activities, applications, reports, logs, chat |

### Data Flow

```
React Components → Contexts (AuthContext, ActivityContext) → API Client (lib/api.ts) → ASP.NET Backend
                                ↕
                         SignalR Hub (real-time updates)
```

- **AuthContext** manages session, user profile, and detects backend connectivity
- **ActivityContext** is the central data store for activities, applications, notifications, and attendance
- **api.ts** provides a typed fetch wrapper with automatic JWT Bearer token injection
- The backend emits real-time events (NotificationReceived, ActivityUpdated, etc.) via SignalR which the frontend subscribes to
