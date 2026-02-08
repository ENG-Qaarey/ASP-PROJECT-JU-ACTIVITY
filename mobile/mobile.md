# Mobile App File Structure

```
mobile/
├── .gitignore
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── ANALYZE.md
├── app.json
├── CHAT_FEATURE.md
├── eslint.config.js
├── global.d.ts
├── metro.config.js
├── package-lock.json
├── package.json
├── README.md
├── tsc_output.txt
├── tsconfig.json
│
├── .gemini/
│   ├── reply-styles.txt
│   ├── swipe-reply-final-step.md
│   └── swipe-reply-implementation.md
│
├── assets/
│   └── images/
│       ├── activity-banner.png
│       ├── android-icon-foreground.png
│       ├── default-avatar.png
│       ├── favicon.png
│       ├── group-icon.png
│       ├── icon.png
│       ├── partial-react-logo.png
│       ├── react-logo.png
│       ├── react-logo@2x.png
│       ├── react-logo@3x.png
│       ├── splash-icon.png
│       └── university-logo.png
│
├── scripts/
│   └── (script files)
│
├── app/                          # Expo Router app directory
│   ├── _layout.tsx               # Root layout
│   ├── +not-found.tsx           # 404 page
│   ├── index.tsx                # Entry point
│   ├── login.tsx                # Login screen
│   ├── register.tsx             # Registration screen
│   ├── forgot-password.tsx      # Password recovery
│   ├── modal.tsx                # Modal screen
│   │
│   ├── chat/                    # Chat feature
│   │   ├── index.tsx            # Chat list
│   │   ├── [id].tsx             # Individual chat screen
│   │   ├── ActivityGroupChat.tsx
│   │   ├── ChatListItem.tsx
│   │   ├── users.tsx            # Community Hub
│   │   ├── settings.tsx         # Private chat settings
│   │   ├── group-settings.tsx   # Group chat settings
│   │   ├── wallpaper.tsx
│   │   └── disappearing-messages.tsx
│   │
│   ├── (tabs)/                  # Main tab navigation
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── activities.tsx
│   │   ├── applications.tsx
│   │   ├── notifications.tsx
│   │   ├── explore.tsx
│   │   └── profile.tsx
│   │
│   ├── (admin)/                 # Admin routes
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── activities.tsx
│   │   ├── applications.tsx
│   │   ├── users.tsx
│   │   ├── create.tsx
│   │   ├── manage-users.tsx
│   │   ├── monitor.tsx
│   │   ├── audit-logs.tsx
│   │   ├── reports.tsx
│   │   ├── notifications.tsx
│   │   ├── profile.tsx
│   │   │
│   │   └── settings/
│   │       ├── personal.tsx
│   │       ├── security.tsx
│   │       ├── notifications.tsx
│   │       └── preferences.tsx
│   │
│   ├── (coordinator)/           # Coordinator routes
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── activities.tsx
│   │   ├── applications.tsx
│   │   ├── attendance.tsx
│   │   ├── notifications.tsx
│   │   ├── propose.tsx
│   │   ├── profile.tsx
│   │   │
│   │   └── settings/
│   │       ├── personal.tsx
│   │       ├── security.tsx
│   │       ├── notifications.tsx
│   │       └── preferences.tsx
│   │
│   └── (student)/               # Student routes
│       ├── _layout.tsx
│       ├── details.tsx          # Activity details
│       │
│       ├── (tabs)/              # Student tabs
│       │   ├── _layout.tsx
│       │   ├── home.tsx
│       │   ├── activities.tsx
│       │   ├── applications.tsx
│       │   ├── notifications.tsx
│       │   └── profile.tsx
│       │
│       ├── settings/
│       │   ├── personal.tsx
│       │   ├── security.tsx
│       │   ├── notifications.tsx
│       │   └── preferences.tsx
│       │
│       └── support/
│           └── faq.tsx
│
└── src/
    ├── components/
    │   ├── ChatIcon.tsx
    │   ├── external-link.tsx
    │   ├── GlassCard.tsx
    │   ├── GradientBackground.tsx
    │   ├── haptic-tab.tsx
    │   ├── hello-wave.tsx
    │   ├── JuButton.tsx
    │   ├── JuInput.tsx
    │   ├── MessageItem.tsx
    │   ├── parallax-scroll-view.tsx
    │   ├── PremiumMessageBubble.tsx
    │   ├── ShakingBellIcon.tsx
    │   ├── SwipeableMessage.tsx
    │   ├── themed-text.tsx
    │   ├── themed-view.tsx
    │   │
    │   ├── chat/
    │   │   ├── GroupChatSettings.tsx
    │   │   ├── PrivateChatSettings.tsx
    │   │   ├── VoiceMessagePlayer.tsx
    │   │   └── ZoomableImageViewer.tsx
    │   │
    │   └── ui/
    │       ├── collapsible.tsx
    │       ├── icon-symbol.tsx
    │       └── icon-symbol.ios.tsx
    │
    ├── context/
    │   ├── AuthContext.tsx
    │   ├── ChatContext.tsx
    │   ├── ThemeContext.tsx
    │   └── ToastContext.tsx
    │
    ├── data/
    │   └── theme.ts
    │
    ├── hooks/
    │   ├── use-color-scheme.ts
    │   ├── use-color-scheme.web.ts
    │   └── use-theme-color.ts
    │
    ├── lib/
    │   └── (library files)
    │
    └── pages/                    # Legacy pages (may be migrated to app/)
        ├── SplashScreen.tsx
        ├── LoginScreen.tsx
        ├── RegisterScreen.tsx
        ├── ForgotPasswordScreen.tsx
        ├── ProfileScreen.tsx
        ├── ExploreScreen.tsx
        ├── ModalScreen.tsx
        ├── NotFound.tsx
        │
        ├── admin/
        │   ├── AdminDashboard.tsx
        │   ├── AdminActivities.tsx
        │   ├── AdminApplications.tsx
        │   ├── AdminCreateActivity.tsx
        │   ├── AdminNotifications.tsx
        │   ├── AdminLogs.tsx
        │   ├── AdminReports.tsx
        │   ├── AdminUsers.tsx
        │   ├── AdminProfile.tsx
        │   ├── AdminPersonalSettings.tsx
        │   ├── AdminSecuritySettings.tsx
        │   ├── AdminAppPreferences.tsx
        │   ├── AdminGlobalNotifications.tsx
        │   ├── ManageUsers.tsx
        │   ├── ManageRoles.tsx
        │   ├── MonitorActivities.tsx
        │   └── SystemLogs.tsx
        │
        ├── coordinator/
        │   ├── CoordinatorDashboard.tsx
        │   ├── CoordinatorActivities.tsx
        │   ├── CoordinatorApplications.tsx
        │   ├── CoordinatorAttendance.tsx
        │   ├── CoordinatorNotifications.tsx
        │   ├── CoordinatorProfile.tsx
        │   ├── CoordinatorPersonalSettings.tsx
        │   ├── CoordinatorSecuritySettings.tsx
        │   ├── CoordinatorAppPreferences.tsx
        │   ├── CoordinatorDutyNotifications.tsx
        │   ├── CreateActivity.tsx
        │   ├── ManageActivities.tsx
        │   ├── ReviewApplications.tsx
        │   ├── ApproveRejectApplication.tsx
        │   └── AttendanceManagement.tsx
        │
        └── student/
            ├── StudentDashboard.tsx
            ├── StudentActivities.tsx
            ├── StudentApplications.tsx
            ├── StudentNotifications.tsx
            ├── StudentProfile.tsx
            ├── ActivityDetails.tsx
            │
            ├── settings/
            │   ├── PersonalInformation.tsx
            │   ├── SecurityPassword.tsx
            │   ├── AppPreferences.tsx
            │   └── DutyNotifications.tsx
            │
            └── support/
                └── PortalHelp.tsx
```

## Overview

**Mobile** is a React Native mobile application built with Expo Router for managing university activities. It provides:

### Key Features
- **Chat System**: Private and group chats with voice messages, images, and file sharing
- **Role-Based Access**: Separate flows for Admin, Coordinator, and Student
- **Activity Management**: Browse, apply, and manage activities
- **Notifications**: Real-time notifications for applications, activities, and messages
- **Settings**: Personal, security, notification, and app preferences

### Key Technologies
- React Native + TypeScript
- Expo Router (file-based routing)
- React Context (Auth, Chat, Theme, Toast)
- Socket.io (real-time chat)
- Expo (development and build)

### Routing Structure
- Uses Expo Router with file-based routing
- Grouped routes: `(tabs)`, `(admin)`, `(coordinator)`, `(student)`
- Dynamic routes: `chat/[id].tsx` for individual chats
- Nested layouts for role-specific navigation
