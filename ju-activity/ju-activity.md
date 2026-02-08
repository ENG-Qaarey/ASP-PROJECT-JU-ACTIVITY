# JU Activity (Web Frontend) File Structure

```
ju-activity/
├── .gitignore
├── ADMIN_CREDENTIALS.md
├── bun.lockb
├── components.json
├── eslint.config.js
├── index.html
├── JU_ACTIVITY_STRUCTURE.md
├── package-lock.json
├── package.json
├── postcss.config.js
├── Query.md
├── README.md
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
├── versions.json
├── vite.config.ts
│
├── public/
│   ├── dev-muscab.svg
│   ├── ju-icon.svg
│   ├── placeholder.svg
│   └── robots.txt
│
└── src/
    ├── App.css
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── vite-env.d.ts
    │
    ├── components/
    │   ├── BrandLogo.tsx
    │   ├── ConnectionError.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── NavLink.tsx
    │   │
    │   ├── layout/
    │   │   └── DashboardLayout.tsx
    │   │
    │   ├── providers/
    │   │   └── theme-provider.tsx
    │   │
    │   ├── routes/
    │   │   └── ProtectedRoute.tsx
    │   │
    │   └── ui/
    │       ├── accordion.tsx
    │       ├── alert-dialog.tsx
    │       ├── alert.tsx
    │       ├── aspect-ratio.tsx
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── breadcrumb.tsx
    │       ├── button.tsx
    │       ├── calendar.tsx
    │       ├── card.tsx
    │       ├── carousel.tsx
    │       ├── chart.tsx
    │       ├── checkbox.tsx
    │       ├── collapsible.tsx
    │       ├── command.tsx
    │       ├── context-menu.tsx
    │       ├── dialog.tsx
    │       ├── drawer.tsx
    │       ├── dropdown-menu.tsx
    │       ├── form.tsx
    │       ├── hover-card.tsx
    │       ├── input-otp.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── loading.tsx
    │       ├── menubar.tsx
    │       ├── navigation-menu.tsx
    │       ├── pagination.tsx
    │       ├── popover.tsx
    │       ├── progress.tsx
    │       ├── radio-group.tsx
    │       ├── resizable.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── sidebar.tsx
    │       ├── skeleton.tsx
    │       ├── slider.tsx
    │       ├── sonner.tsx
    │       ├── switch.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── textarea.tsx
    │       ├── toast.tsx
    │       ├── toaster.tsx
    │       ├── toggle-group.tsx
    │       ├── toggle.tsx
    │       ├── tooltip.tsx
    │       └── use-toast.ts
    │
    ├── contexts/
    │   ├── ActivityContext.tsx
    │   └── AuthContext.tsx
    │
    ├── data/
    │   └── mockData.ts
    │
    ├── hooks/
    │   ├── use-mobile.tsx
    │   └── use-toast.ts
    │
    ├── lib/
    │   ├── api.ts
    │   ├── reportUtils.ts
    │   └── utils.ts
    │
    ├── pages/
    │   ├── AccessDenied.tsx
    │   ├── ChangePasswordScreen.tsx
    │   ├── ForgotPasswordScreen.tsx
    │   ├── Index.tsx
    │   ├── LoginScreen.tsx
    │   ├── NotFound.tsx
    │   ├── NotificationsCenter.tsx
    │   ├── ProfileScreen.tsx
    │   ├── RegisterScreen.tsx
    │   ├── SplashScreen.tsx
    │   ├── VerifyEmailPending.tsx
    │   │
    │   ├── admin/
    │   │   ├── AdminActivities.tsx
    │   │   ├── AdminApplications.tsx
    │   │   ├── AdminCreateActivity.tsx
    │   │   ├── AdminDashboard.tsx
    │   │   ├── AdminLogs.tsx
    │   │   ├── AdminNotifications.tsx
    │   │   ├── AdminReports.tsx
    │   │   ├── AdminUsers.tsx
    │   │   ├── ManageRoles.tsx
    │   │   ├── ManageUsers.tsx
    │   │   ├── MonitorActivities.tsx
    │   │   └── SystemLogs.tsx
    │   │
    │   ├── coordinator/
    │   │   ├── ApproveRejectApplication.tsx
    │   │   ├── AttendanceManagement.tsx
    │   │   ├── CoordinatorActivities.tsx
    │   │   ├── CoordinatorApplications.tsx
    │   │   ├── CoordinatorAttendance.tsx
    │   │   ├── CoordinatorDashboard.tsx
    │   │   ├── CoordinatorNotifications.tsx
    │   │   ├── CreateActivity.tsx
    │   │   ├── ManageActivities.tsx
    │   │   └── ReviewApplications.tsx
    │   │
    │   └── student/
    │       ├── ActivityDetails.tsx
    │       ├── StudentActivities.tsx
    │       ├── StudentApplications.tsx
    │       ├── StudentDashboard.tsx
    │       └── StudentNotifications.tsx
    │
    ├── services/
    │   └── userService.ts
    │
    └── shims/
        └── useSyncExternalStore.ts
```

## Overview

**JU Activity** is a React + Vite web application for managing university activities. It provides role-based dashboards for:
- **Admins**: System management, user management, reports, logs
- **Coordinators**: Activity management, application review, attendance
- **Students**: Browse activities, apply, view notifications

### Key Technologies
- React + TypeScript
- Vite (build tool)
- Tailwind CSS
- shadcn/ui components
- React Router (protected routes)
