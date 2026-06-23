import { STORAGE_KEYS, API } from "@/constants/api";

// The base URL for all API requests (e.g. "http://localhost:5281/api")
const API_BASE_URL = API.BASE_URL;

// ============================================================
// 1. HELPERS - Simple tools used by the API functions below
// ============================================================

// Get the saved token from the browser's localStorage
function getSavedToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

// Build a full URL: base + endpoint + optional query string
function buildUrl(endpoint, queryParams = "") {
  let url = `${API_BASE_URL}${endpoint}`;
  if (queryParams) {
    url += "?" + queryParams;
  }
  return url;
}

// Turn an object like { status: "upcoming" } into "status=upcoming"
function toQueryString(params) {
  const parts = [];
  for (const key in params) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${key}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join("&");
}

// ============================================================
// 2. MAIN REQUEST FUNCTION - Every API call goes through here
// ============================================================

// This function sends a request to the backend, adds the auth token
// automatically, and returns the JSON response.
async function apiRequest(url, options?) {
  // Default to empty object if no options were provided
  if (!options) options = {};

  // Get the saved auth token
  const token = getSavedToken();

  // Start with the JSON content type header
  const headers = { "Content-Type": "application/json" };

  // Add the auth token if we have one
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // For file uploads, don't set Content-Type (browser sets it automatically)
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  // Make the request
  let response;
  try {
    response = await fetch(url, {
      method: options.method,
      body: options.body,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
  } catch (error) {
    // Network error (backend is down, no internet, etc.)
    throw new Error(
      `Network error: Unable to reach the server at ${url}. Is the backend running?`
    );
  }

  // If the response is not OK (like 401, 404, 500, etc.)
  if (!response.ok) {
    // Try to get the error message from the response body
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // couldn't parse error body, use default message
    }

    throw new Error(errorMessage);
  }

  // Success - return the JSON data
  return response.json();
}

// ============================================================
// 3. AUTHENTICATION - Login, Register, Password Reset
// ============================================================

export const authApi = {
  // Login with email and password
  login: (email, password) =>
    apiRequest(buildUrl("/auth/login"), {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Create a new account
  register: (data) =>
    apiRequest(buildUrl("/auth/register"), {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Get the currently logged-in user's info
  me: () => apiRequest(buildUrl("/auth/me")),

  // Sign in with Google
  googleSignIn: (credential) =>
    apiRequest(buildUrl("/auth/google"), {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),

  // Request a password reset email
  forgotPassword: (email) =>
    apiRequest(buildUrl("/auth/forgot-password"), {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // Reset password with the code from the email
  resetPassword: (payload) =>
    apiRequest(buildUrl("/auth/reset-password"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Get a new access token using a refresh token
  refresh: (refreshToken) =>
    apiRequest(buildUrl("/auth/refresh"), {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};

// ============================================================
// 4. USERS - View, Create, Update, Delete Users
// ============================================================

export const usersApi = {
  // Get all users (optional filters: role, email)
  getAll: (role, token, email) => {
    let query = "";
    if (role) query += `role=${role}`;
    if (email) query += (query ? "&" : "") + `email=${email}`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest(buildUrl("/users", query), { headers });
  },

  // Get a single user by ID
  getById: (id) => apiRequest(buildUrl(`/users/${id}`)),

  // Create a new user (admin only)
  create: (data) =>
    apiRequest(buildUrl("/users"), {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update a user's info (admin only)
  update: (id, data) =>
    apiRequest(buildUrl(`/users/${id}`), {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Get the current user's profile
  getMe: () => apiRequest(buildUrl("/users/me")),

  // Update the current user's profile
  updateMe: (data) =>
    apiRequest(buildUrl("/users/me"), {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Upload a profile picture
  uploadMyAvatar: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest(buildUrl("/users/me/avatar"), {
      method: "POST",
      body: formData,
    });
  },

  // Change a user's password (admin only)
  updatePassword: (id, oldPassword, newPassword) =>
    apiRequest(buildUrl(`/users/${id}/password`), {
      method: "PATCH",
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  // Change the current user's password
  updateMyPassword: (oldPassword, newPassword) =>
    apiRequest(buildUrl("/users/me/password"), {
      method: "PATCH",
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  // Activate or deactivate a user (admin only)
  toggleStatus: (id) =>
    apiRequest(buildUrl(`/users/${id}/status`), {
      method: "PATCH",
    }),

  // Delete a user (admin only)
  delete: (id) =>
    apiRequest(buildUrl(`/users/${id}`), {
      method: "DELETE",
    }),
};

// ============================================================
// 5. ACTIVITIES - Browse, Create, Update, Delete Activities
// ============================================================

export const activitiesApi = {
  // Get all activities (optional filters: status, category, coordinator)
  getAll: (params) =>
    apiRequest(buildUrl("/activities", toQueryString(params))),

  // Get a single activity by ID
  getById: (id) => apiRequest(buildUrl(`/activities/${id}`)),

  // Create a new activity
  create: (data) =>
    apiRequest(buildUrl("/activities"), {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update an activity
  update: (id, data) =>
    apiRequest(buildUrl(`/activities/${id}`), {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete an activity
  delete: (id) =>
    apiRequest(buildUrl(`/activities/${id}`), {
      method: "DELETE",
    }),
};

// ============================================================
// 6. APPLICATIONS - Students Applying for Activities
// ============================================================

export const applicationsApi = {
  // Get all applications (optional filters: status, student, activity)
  getAll: (params) =>
    apiRequest(buildUrl("/applications", toQueryString(params))),

  // Get approved applications for attendance marking
  getApprovedForAttendance: (activityId) =>
    apiRequest(
      buildUrl(
        `/applications/attendance/approved`,
        toQueryString({ activityId })
      )
    ),

  // Get a single application by ID
  getById: (id) => apiRequest(buildUrl(`/applications/${id}`)),

  // Get application statistics for an activity
  getStats: (activityId) =>
    apiRequest(buildUrl(`/applications/stats/${activityId}`)),

  // Submit a new application
  create: (data) =>
    apiRequest(buildUrl("/applications"), {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Approve, reject, or waitlist an application
  updateStatus: (id, status, notes) =>
    apiRequest(buildUrl(`/applications/${id}/status`), {
      method: "PUT",
      body: JSON.stringify({ status, notes }),
    }),

  // Delete an application
  delete: (id) =>
    apiRequest(buildUrl(`/applications/${id}`), {
      method: "DELETE",
    }),
};

// ============================================================
// 7. NOTIFICATIONS - In-App Alerts
// ============================================================

export const notificationsApi = {
  // Get all notifications (optional filters)
  getAll: (params) =>
    apiRequest(buildUrl("/notifications", toQueryString(params))),

  // Get a single notification by ID
  getById: (id) => apiRequest(buildUrl(`/notifications/${id}`)),

  // Get the count of unread notifications
  getUnreadCount: (recipientId) =>
    apiRequest(
      buildUrl("/notifications/unread/count", toQueryString({ recipientId }))
    ),

  // Create a new notification
  create: (data) =>
    apiRequest(buildUrl("/notifications"), {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Mark a notification as read
  markAsRead: (id) =>
    apiRequest(buildUrl(`/notifications/${id}/read`), {
      method: "PUT",
    }),

  // Mark all notifications as read
  markAllAsRead: (recipientId) =>
    apiRequest(
      buildUrl("/notifications/read/all", toQueryString({ recipientId })),
      { method: "PUT" }
    ),

  // Delete a notification
  delete: (id) =>
    apiRequest(buildUrl(`/notifications/${id}`), {
      method: "DELETE",
    }),
};

// ============================================================
// 8. ATTENDANCE - Marking Student Attendance
// ============================================================

export const attendanceApi = {
  // Get attendance records (optional filters)
  getAll: (params) =>
    apiRequest(buildUrl("/attendance", toQueryString(params))),

  // Get a single attendance record
  getById: (id) => apiRequest(buildUrl(`/attendance/${id}`)),

  // Get attendance statistics for an activity
  getStats: (activityId) =>
    apiRequest(buildUrl(`/attendance/stats/${activityId}`)),

  // Mark a single student as present/absent
  markAttendance: (data) =>
    apiRequest(buildUrl("/attendance"), {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Mark attendance for multiple students at once
  batchMarkAttendance: (data) =>
    apiRequest(buildUrl("/attendance/batch"), {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Generate a QR code for attendance
  generateQR: (activityId) =>
    apiRequest(buildUrl(`/attendance/qr/generate/${activityId}`)),

  // Scan a QR code to mark attendance
  scanQR: (data) =>
    apiRequest(buildUrl("/attendance/qr/scan"), {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// 9. AUDIT LOGS - Track Who Did What (Admin Only)
// ============================================================

export const auditLogsApi = {
  // Get audit log entries (with search and filters)
  getAll: (params) =>
    apiRequest(buildUrl("/audit-logs", toQueryString(params))),

  // Download audit logs as a CSV file
  exportCsv: async (params) => {
    const url = buildUrl("/audit-logs/export/csv", toQueryString(params));
    const token = getSavedToken();

    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error("Failed to export CSV");
    }

    // Create a download link and click it
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `audit-logs.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Download audit logs as a JSON file
  exportJson: async (params) => {
    const url = buildUrl("/audit-logs/export/json", toQueryString(params));
    const token = getSavedToken();

    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error("Failed to export JSON");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `audit-logs.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

// ============================================================
// 10. MESSAGES - Activity Chat
// ============================================================

export const messagesApi = {
  // Get messages for an activity (with pagination)
  getByActivity: (activityId, offset = 0, limit = 50) =>
    apiRequest(
      buildUrl(
        "/messages",
        toQueryString({ activityId, offset, limit })
      )
    ),

  // Send a message
  send: (activityId, content, type, metadata, parentId) =>
    apiRequest(buildUrl("/messages"), {
      method: "POST",
      body: JSON.stringify({ activityId, content, type, metadata, parentId }),
    }),

  // Edit a message
  edit: (id, content) =>
    apiRequest(buildUrl(`/messages/${id}`), {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),

  // Delete a message
  delete: (id) =>
    apiRequest(buildUrl(`/messages/${id}`), {
      method: "DELETE",
    }),

  // Add or remove an emoji reaction on a message
  toggleReaction: (id, emoji) =>
    apiRequest(buildUrl(`/messages/${id}/react`), {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }),

  // Get the list of members in an activity chat
  getMembers: (activityId) =>
    apiRequest(
      buildUrl("/messages/members", toQueryString({ activityId }))
    ),

  // Mark all messages in an activity as read
  markAsRead: (activityId) =>
    apiRequest(buildUrl("/messages/read"), {
      method: "POST",
      body: JSON.stringify({ activityId }),
    }),

  // Get unread message counts for all activities
  getUnreadCounts: () => apiRequest(buildUrl("/messages/unread")),

  // Get the last message preview for each activity
  getLastMessages: () => apiRequest(buildUrl("/messages/preview")),

  // Upload a file to an activity chat
  upload: (activityId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest(
      buildUrl("/messages/upload", toQueryString({ activityId })),
      { method: "POST", body: formData }
    );
  },
};

// ============================================================
// 11. CATEGORIES - Activity Categories
// ============================================================

export const categoriesApi = {
  // Get all categories
  getAll: () => apiRequest(buildUrl("/categories")),

  // Create a new category
  create: (name) =>
    apiRequest(buildUrl("/categories"), {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
};
