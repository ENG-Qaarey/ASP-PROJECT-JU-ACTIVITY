import { ChatMessage } from "./chat";

export interface ApiResponse {
  success: boolean;
  message?: string;
}

export interface AuthResponse extends ApiResponse {
  user: User;
  token?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "coordinator" | "admin";
  studentId?: string;
  avatar?: string;
  department?: string;
  joinedAt?: string;
  status?: "active" | "inactive";
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  enrolled: number;
  coordinatorId: string;
  coordinatorName: string;
  status: "upcoming" | "ongoing" | "completed";
}

export interface Application {
  id: string;
  studentId: string;
  studentName: string;
  activityId: string;
  activityTitle: string;
  appliedAt: string;
  status: "pending" | "approved" | "rejected" | "waitlisted";
  notes?: string;
  studentAvatar?: string | null;
  studentEmail?: string;
  studentDepartment?: string;
  student?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "approval" | "rejection" | "announcement" | "reminder" | "waitlist";
  read: boolean;
  createdAt: string;
  recipientId?: string;
}

export interface Attendance {
  id: string;
  activityId: string;
  studentId: string;
  studentName: string;
  applicationId: string;
  status: "present" | "absent";
  markedBy: string;
  markedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorEmail?: string;
  targetEmail?: string;
  actorRole?: string;
  createdAt: string;
  actorId?: string;
  targetId?: string;
  details?: string;
}

export interface MessageResponse {
  messages: ChatMessage[];
  total: number;
  offset: number;
  limit: number;
}

export type LastMessagesRecord = Record<string, { content: string; senderName: string; createdAt: string }>;

export interface Category {
  id: string;
  name: string;
}

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  contentType: string;
}

export interface AttendanceBatchPayload {
  activityId: string;
  attendanceData: Array<{
    studentId: string;
    studentName: string;
    applicationId: string;
    status: string;
  }>;
  markedBy: string;
}

export interface QRScanPayload {
  activityId: string;
  token: string;
  location?: { lat: number; lng: number };
}
