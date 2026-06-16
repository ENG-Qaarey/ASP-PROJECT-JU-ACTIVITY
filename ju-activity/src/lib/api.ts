import type {
  Activity,
  ApiResponse,
  Application,
  Attendance,
  AuditLog,
  AuthResponse,
  Category,
  LastMessagesRecord,
  MessageResponse,
  Notification,
  UploadResult,
  User,
} from "@/types/api";
import type { ChatMessage, Member } from "@/types/chat";

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

/** Error class for API responses with non-2xx status or network failures. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let onApiError: ((error: ApiError) => void) | null = null;

/** Register a global handler invoked on every ApiError before rejection. */
export const setApiErrorHandler = (handler: ((error: ApiError) => void) | null) => {
  onApiError = handler;
};

let getToken: (() => Promise<string | null>) | null = null;

/** Provide a function that returns a Bearer token attached to every request. */
export const setTokenProvider = (provider: () => Promise<string | null>) => {
  getToken = provider;
};

/** Low-level fetch wrapper used by all API modules. Attaches auth headers and normalises errors. */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  let token: string | null = null;
  if (getToken) {
    try {
      token = await getToken();
    } catch (e) {
      console.warn("Failed to get token", e);
    }
  }

  const isFormDataBody =
    typeof FormData !== 'undefined' &&
    options.body instanceof FormData;

  const config: RequestInit = {
    ...options,
    headers: {
      ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error: unknown) {
    const hint = `Network error calling ${url}. Is the backend running and CORS configured?`;
    const message = error instanceof Error ? error.message : String(error);
    const apiError = new ApiError(0, `${hint}${message ? ` (${message})` : ''}`);
    onApiError?.(apiError);
    throw apiError;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    const apiError = new ApiError(response.status, error.message || 'Request failed');
    onApiError?.(apiError);
    throw apiError;
  }

  return response.json();
}

/** Authentication endpoints — login, register, OAuth, password reset. */
export const authApi = {
  /** Authenticate with email/password credentials. */
  login: (email: string, password: string) =>
    fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** Create a new user account with the given profile fields. */
  register: (data: {
    name: string;
    email: string;
    password: string;
    studentId?: string;
    department?: string;
  }) =>
    fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Get the currently authenticated user's profile and session. */
  me: () => fetchApi<AuthResponse>('/auth/me'),

  /** Sign in or link a Google account via the returned credential token. */
  googleSignIn: (credential: string) =>
    fetchApi<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),

  /** Send a password-reset email to the given address. */
  forgotPassword: (email: string) =>
    fetchApi<ApiResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** Reset the password using the token from the reset email. */
  resetPassword: (payload: { email: string; newPassword: string }) =>
    fetchApi<ApiResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

/** User CRUD — profile retrieval, updates, avatar upload, password changes. */
export const usersApi = {
  /** List all users, optionally filtered by role or email. An admin token can be passed for server auth. */
  getAll: (role?: string, token?: string, email?: string) => {
    let query = role ? `?role=${role}` : '';
    if (email) {
      query += query ? `&email=${email}` : `?email=${email}`;
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return fetchApi<User[]>('/users' + query, { headers });
  },

  /** Get a single user by ID. */
  getById: (id: string) => fetchApi<User>(`/users/${id}`),

  /** Create a new user (admin only on the backend). */
  create: (data: Partial<User> & { password?: string }) =>
    fetchApi<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Update any user's profile fields (admin only). */
  update: (id: string, data: Partial<User>) =>
    fetchApi<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** Get the current user's profile. */
  getMe: () => fetchApi<User>('/users/me'),

  /** Update the current user's profile fields. */
  updateMe: (data: Partial<User>) =>
    fetchApi<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /** Upload a new avatar image for the current user. */
  uploadMyAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi<User>('/users/me/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  /** Change another user's password (admin only). */
  updatePassword: (id: string, oldPassword: string, newPassword: string) =>
    fetchApi<ApiResponse>(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  /** Change the current user's password. */
  updateMyPassword: (oldPassword: string, newPassword: string) =>
    fetchApi<ApiResponse>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  /** Toggle a user between active/inactive status (admin only). */
  toggleStatus: (id: string) =>
    fetchApi<User>(`/users/${id}/status`, {
      method: 'PATCH',
    }),

  /** Permanently delete a user account (admin only). */
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

/** Activity CRUD — list, create, update, and delete activities. */
export const activitiesApi = {
  /** List activities, optionally filtered by status, category, or coordinator. */
  getAll: (params?: { status?: string; category?: string; coordinatorId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<Activity[]>('/activities' + (query ? `?${query}` : ''));
  },

  /** Get a single activity by ID. */
  getById: (id: string) => fetchApi<Activity>(`/activities/${id}`),

  /** Create a new activity (admin only). */
  create: (data: Partial<Activity>) =>
    fetchApi<Activity>('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Update activity fields by ID. */
  update: (id: string, data: Partial<Activity>) =>
    fetchApi<Activity>(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** Delete an activity by ID. */
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/activities/${id}`, {
      method: 'DELETE',
    }),
};

/** Application CRUD — student applications to activities, status updates, stats. */
export const applicationsApi = {
  /** List applications, optionally filtered by status, student, or activity. */
  getAll: (params?: { status?: string; studentId?: string; activityId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<Application[]>('/applications' + (query ? `?${query}` : ''));
  },

  /** Get approved applications for a given activity (used for attendance marking). */
  getApprovedForAttendance: (activityId: string) =>
    fetchApi<Application[]>(`/applications/attendance/approved?activityId=${encodeURIComponent(activityId)}`),

  /** Get a single application by ID. */
  getById: (id: string) => fetchApi<Application>(`/applications/${id}`),

  /** Get application statistics (counts by status) for an activity. */
  getStats: (activityId: string) =>
    fetchApi<Record<string, number>>(`/applications/stats/${activityId}`),

  /** Submit a new application to an activity. */
  create: (data: Partial<Application>) =>
    fetchApi<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Update the status of an application (approve/reject/waitlist). */
  updateStatus: (id: string, status: string, notes?: string) =>
    fetchApi<Application>(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  /** Delete an application by ID. */
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/applications/${id}`, {
      method: 'DELETE',
    }),
};

/** Notification retrieval, creation, and read-state management. */
export const notificationsApi = {
  /** List notifications, optionally filtered by recipient, read state, or type. */
  getAll: (params?: { recipientId?: string; read?: boolean; type?: string }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return fetchApi<Notification[]>('/notifications' + (query ? `?${query}` : ''));
  },

  /** Get a single notification by ID. */
  getById: (id: string) => fetchApi<Notification>(`/notifications/${id}`),

  /** Get the count of unread notifications for a recipient. */
  getUnreadCount: (recipientId?: string) => {
    const query = recipientId ? `?recipientId=${recipientId}` : '';
    return fetchApi<number>('/notifications/unread/count' + query);
  },

  /** Create a new notification sent to the specified recipient. */
  create: (data: Partial<Notification>) =>
    fetchApi<Notification>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Mark a single notification as read by ID. */
  markAsRead: (id: string) =>
    fetchApi<Notification>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),

  /** Mark all notifications for a recipient as read. */
  markAllAsRead: (recipientId?: string) => {
    const query = recipientId ? `?recipientId=${recipientId}` : '';
    return fetchApi<ApiResponse>('/notifications/read/all' + query, {
      method: 'PUT',
    });
  },

  /** Delete a notification by ID. */
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/notifications/${id}`, {
      method: 'DELETE',
    }),
};

/** Attendance records — mark, batch-mark, QR generation and scanning. */
export const attendanceApi = {
  /** List attendance records, optionally filtered by activity, student, or status. */
  getAll: (params?: { activityId?: string; studentId?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<Attendance[]>('/attendance' + (query ? `?${query}` : ''));
  },

  /** Get a single attendance record by ID. */
  getById: (id: string) => fetchApi<Attendance>(`/attendance/${id}`),

  /** Get attendance statistics (present/absent counts) for an activity. */
  getStats: (activityId: string) =>
    fetchApi<Record<string, number>>(`/attendance/stats/${activityId}`),

  /** Mark a single student's attendance for an activity. */
  markAttendance: (data: Partial<Attendance>) =>
    fetchApi<Attendance>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Mark attendance for multiple students at once. */
  batchMarkAttendance: (data: {
    activityId: string;
    attendanceData: Array<{
      studentId: string;
      studentName: string;
      applicationId: string;
      status: string;
    }>;
    markedBy: string;
  }) =>
    fetchApi<Attendance[]>('/attendance/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Generate a QR code token that students can scan to mark attendance. */
  generateQR: (activityId: string) =>
    fetchApi<{ token: string }>(`/attendance/qr/generate/${activityId}`),

  /** Scan a QR code to mark attendance, with optional location verification. */
  scanQR: (data: { activityId: string; token: string; location?: { lat: number; lng: number } }) =>
    fetchApi<Attendance>('/attendance/qr/scan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

/** Admin audit trail — searchable, filterable action log. */
export const auditLogsApi = {
  /** List audit log entries with optional full-text search, date range, and pagination. */
  getAll: (params?: { q?: string; action?: string; actorId?: string; targetId?: string; from?: string; to?: string; skip?: number; take?: number }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>),
    ).toString();
    return fetchApi<AuditLog[]>('/audit-logs' + (query ? `?${query}` : ''));
  },
};

/** Chat messages — send, edit, delete, react, upload, and retrieve per-activity. */
export const messagesApi = {
  /** Get paginated messages for a given activity, newest-first. */
  getByActivity: (activityId: string, offset = 0, limit = 50) =>
    fetchApi<MessageResponse>(
      `/messages?activityId=${encodeURIComponent(activityId)}&offset=${offset}&limit=${limit}`
    ),

  /** Send a new message (text, image, file, or audio) to an activity chat. */
  send: (activityId: string, content: string, type?: string, metadata?: string, parentId?: string) =>
    fetchApi<ChatMessage>('/messages', {
      method: 'POST',
      body: JSON.stringify({ activityId, content, type, metadata, parentId }),
    }),

  /** Edit the content of an existing message. */
  edit: (id: string, content: string) =>
    fetchApi<ChatMessage>(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  /** Soft-delete a message by ID. */
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/messages/${id}`, {
      method: 'DELETE',
    }),

  /** Toggle a reaction emoji on a message (add if absent, remove if present). */
  toggleReaction: (id: string, emoji: string) =>
    fetchApi<ChatMessage>(`/messages/${id}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),

  /** Get the list of chat members for an activity. */
  getMembers: (activityId: string) =>
    fetchApi<Member[]>(`/messages/members?activityId=${encodeURIComponent(activityId)}`),

  /** Mark all messages in an activity as read for the current user. */
  markAsRead: (activityId: string) =>
    fetchApi<ApiResponse>('/messages/read', {
      method: 'POST',
      body: JSON.stringify({ activityId }),
    }),

  /** Get a map of activity ID → unread message count for the current user. */
  getUnreadCounts: () =>
    fetchApi<Record<string, number>>('/messages/unread'),

  /** Get the last message preview for every activity the current user belongs to. */
  getLastMessages: () =>
    fetchApi<LastMessagesRecord>('/messages/preview'),

  /** Upload a file attachment to an activity chat. Returns the URL and metadata. */
  upload: (activityId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi<UploadResult>(
      `/messages/upload?activityId=${encodeURIComponent(activityId)}`,
      { method: 'POST', body: formData }
    );
  },
};

/** Activity categories — list all or create a new one. */
export const categoriesApi = {
  /** List all available activity categories. */
  getAll: () => fetchApi<Category[]>('/categories'),

  /** Create a new category by name. */
  create: (name: string) =>
    fetchApi<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
};
