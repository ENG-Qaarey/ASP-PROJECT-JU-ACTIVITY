import axios from "axios";
import { STORAGE_KEYS, API } from "@/constants/api";

const api = axios.create({
  baseURL: API.BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      throw new Error(
        `Network error: Unable to reach the server at ${error.config?.baseURL}${error.config?.url}. Is the backend running?`
      );
    }
    const message =
      error.response.data?.message ||
      `Request failed with status ${error.response.status}`;
    throw new Error(message);
  }
);

// ============================================================
// 1. AUTHENTICATION
// ============================================================

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  register: (data: any) => api.post("/auth/register", data),

  me: () => api.get("/auth/me"),

  googleSignIn: (credential: string) =>
    api.post("/auth/google", { credential }),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (payload: any) =>
    api.post("/auth/reset-password", payload),

  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
};

// ============================================================
// 2. USERS
// ============================================================

export const usersApi = {
  getAll: (role?: string, token?: string, email?: string) => {
    const params: Record<string, string> = {};
    if (role) params.role = role;
    if (email) params.email = email;
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    return api.get("/users", { params, headers });
  },

  getById: (id: number | string) => api.get(`/users/${id}`),

  create: (data: any) => api.post("/users", data),

  update: (id: number | string, data: any) => api.put(`/users/${id}`, data),

  getMe: () => api.get("/users/me"),

  updateMe: (data: any) => api.patch("/users/me", data),

  uploadMyAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/users/me/avatar", formData);
  },

  updatePassword: (id: number | string, oldPassword: string, newPassword: string) =>
    api.patch(`/users/${id}/password`, { oldPassword, newPassword }),

  updateMyPassword: (oldPassword: string, newPassword: string) =>
    api.patch("/users/me/password", { oldPassword, newPassword }),

  toggleStatus: (id: number | string) =>
    api.patch(`/users/${id}/status`),

  delete: (id: number | string) => api.delete(`/users/${id}`),
};

// ============================================================
// 3. ACTIVITIES
// ============================================================

export const activitiesApi = {
  getAll: (params?: Record<string, any>) =>
    api.get("/activities", { params }),

  getById: (id: number | string) => api.get(`/activities/${id}`),

  create: (data: any) => api.post("/activities", data),

  update: (id: number | string, data: any) =>
    api.put(`/activities/${id}`, data),

  delete: (id: number | string) => api.delete(`/activities/${id}`),
};

// ============================================================
// 4. APPLICATIONS
// ============================================================

export const applicationsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get("/applications", { params }),

  getApprovedForAttendance: (activityId: number | string) =>
    api.get("/applications/attendance/approved", {
      params: { activityId },
    }),

  getById: (id: number | string) => api.get(`/applications/${id}`),

  getStats: (activityId: number | string) =>
    api.get(`/applications/stats/${activityId}`),

  create: (data: any) => api.post("/applications", data),

  updateStatus: (id: number | string, status: string, notes?: string) =>
    api.put(`/applications/${id}/status`, { status, notes }),

  delete: (id: number | string) => api.delete(`/applications/${id}`),
};

// ============================================================
// 5. NOTIFICATIONS
// ============================================================

export const notificationsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get("/notifications", { params }),

  getById: (id: number | string) => api.get(`/notifications/${id}`),

  getUnreadCount: (recipientId: number | string) =>
    api.get("/notifications/unread/count", {
      params: { recipientId },
    }),

  create: (data: any) => api.post("/notifications", data),

  markAsRead: (id: number | string) =>
    api.put(`/notifications/${id}/read`),

  markAllAsRead: (recipientId: number | string) =>
    api.put("/notifications/read/all", null, {
      params: { recipientId },
    }),

  delete: (id: number | string) => api.delete(`/notifications/${id}`),
};

// ============================================================
// 6. ATTENDANCE
// ============================================================

export const attendanceApi = {
  getAll: (params?: Record<string, any>) =>
    api.get("/attendance", { params }),

  getById: (id: number | string) => api.get(`/attendance/${id}`),

  getStats: (activityId: number | string) =>
    api.get(`/attendance/stats/${activityId}`),

  markAttendance: (data: any) => api.post("/attendance", data),

  batchMarkAttendance: (data: any) => api.post("/attendance/batch", data),

  generateQR: (activityId: number | string) =>
    api.get(`/attendance/qr/generate/${activityId}`),

  scanQR: (data: any) => api.post("/attendance/qr/scan", data),
};

// ============================================================
// 7. AUDIT LOGS
// ============================================================

async function downloadFile(url: string, filename: string) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const response = await axios.get(url, {
    responseType: "blob",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const downloadUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export const auditLogsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get("/audit-logs", { params }),

  exportCsv: (params?: Record<string, any>) =>
    downloadFile(
      `${API.BASE_URL}/audit-logs/export/csv?${new URLSearchParams(params || {}).toString()}`,
      "audit-logs.csv"
    ),

  exportJson: (params?: Record<string, any>) =>
    downloadFile(
      `${API.BASE_URL}/audit-logs/export/json?${new URLSearchParams(params || {}).toString()}`,
      "audit-logs.json"
    ),
};

// ============================================================
// 8. MESSAGES
// ============================================================

export const messagesApi = {
  getByActivity: (
    activityId: number | string,
    offset = 0,
    limit = 50
  ) =>
    api.get("/messages", {
      params: { activityId, offset, limit },
    }),

  send: (
    activityId: number | string,
    content: string,
    type?: string,
    metadata?: any,
    parentId?: number | string
  ) =>
    api.post("/messages", {
      activityId,
      content,
      type,
      metadata,
      parentId,
    }),

  edit: (id: number | string, content: string) =>
    api.put(`/messages/${id}`, { content }),

  delete: (id: number | string) => api.delete(`/messages/${id}`),

  toggleReaction: (id: number | string, emoji: string) =>
    api.post(`/messages/${id}/react`, { emoji }),

  getMembers: (activityId: number | string) =>
    api.get("/messages/members", { params: { activityId } }),

  markAsRead: (activityId: number | string) =>
    api.post("/messages/read", { activityId }),

  getUnreadCounts: () => api.get("/messages/unread"),

  getLastMessages: () => api.get("/messages/preview"),

  upload: (activityId: number | string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/messages/upload", formData, {
      params: { activityId },
    });
  },
};

// ============================================================
// 9. CATEGORIES
// ============================================================

export const categoriesApi = {
  getAll: () => api.get("/categories"),

  create: (name: string) => api.post("/categories", { name }),
};
