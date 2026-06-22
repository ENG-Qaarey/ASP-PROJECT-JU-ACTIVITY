export const ROLES = {
  STUDENT: "student",
  COORDINATOR: "coordinator",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
