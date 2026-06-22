export const APP_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
} as const;

export const ACTIVITY_STATUS = {
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
} as const;

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
