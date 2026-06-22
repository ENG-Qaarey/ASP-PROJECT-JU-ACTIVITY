export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  NOT_FOUND: "*",
  STUDENT: {
    DASHBOARD: "/student/dashboard",
    ACTIVITIES: "/student/activities",
    ACTIVITY_DETAILS: (id: string) => `/student/activities/${id}`,
    APPLICATIONS: "/student/applications",
    CHAT: "/student/chat",
    CHAT_ROOM: (activityId?: string) =>
      `/student/chat${activityId ? `/${activityId}` : ""}`,
    NOTIFICATIONS: "/student/notifications",
    CALENDAR: "/student/calendar",
    PROFILE: "/student/profile",
    CHANGE_PASSWORD: "/student/change-password",
  },
  COORDINATOR: {
    DASHBOARD: "/coordinator/dashboard",
    ACTIVITIES: "/coordinator/activities",
    ACTIVITY_DETAILS: (id: string) => `/coordinator/activities/${id}`,
    ACTIVITY_EDIT: (id: string) => `/coordinator/activities/${id}/edit`,
    APPLICATIONS: "/coordinator/applications",
    ATTENDANCE: "/coordinator/attendance",
    CHAT: "/coordinator/chat",
    CHAT_ROOM: (activityId?: string) =>
      `/coordinator/chat${activityId ? `/${activityId}` : ""}`,
    NOTIFICATIONS: "/coordinator/notifications",
    CALENDAR: "/coordinator/calendar",
    PROFILE: "/coordinator/profile",
    CHANGE_PASSWORD: "/coordinator/change-password",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    CREATE_ACTIVITY: "/admin/create-activity",
    APPLICATIONS: "/admin/applications",
    USERS: "/admin/users",
    MANAGE_USERS: "/admin/manage-users",
    MANAGE_ROLES: "/admin/manage-roles",
    ACTIVITIES: "/admin/activities",
    ACTIVITY_DETAILS: (id: string) => `/admin/activities/${id}`,
    MONITOR_ACTIVITIES: "/admin/monitor-activities",
    CHAT: "/admin/chat",
    CHAT_ROOM: (activityId?: string) =>
      `/admin/chat${activityId ? `/${activityId}` : ""}`,
    NOTIFICATIONS: "/admin/notifications",
    REPORTS: "/admin/reports-advanced",

    LOGS: "/admin/logs",
    CALENDAR: "/admin/calendar",
    PROFILE: "/admin/profile",
    CHANGE_PASSWORD: "/admin/change-password",
  },
} as const;

export const ROLE_PATHS: Record<string, typeof ROUTES.STUDENT> = {
  student: ROUTES.STUDENT,
  coordinator: ROUTES.COORDINATOR,
  admin: ROUTES.ADMIN,
} as const;
