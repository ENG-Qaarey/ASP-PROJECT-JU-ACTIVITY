## Database Tables (11 models + 1 enum-backed)

### 1. `users` — Core user accounts

| Field                          | Type      | Notes                                                                                                                                                                                                                                           |
| ------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                             | UUID      | PK                                                                                                                                                                                                                                              |
| name                           | String    |                                                                                                                                                                                                                                                 |
| email                          | String    | Unique, normalized lowercase                                                                                                                                                                                                                    |
| role                           | Enum      | `student`, `coordinator`, `admin`                                                                                                                                                                                                               |
| studentId                      | String?   | University ID                                                                                                                                                                                                                                   |
| avatar                         | String?   | URL path                                                                                                                                                                                                                                        |
| department                     | String?   |                                                                                                                                                                                                                                                 |
| joinedAt                       | Date?     |                                                                                                                                                                                                                                                 |
| status                         | Enum      | `active`, `inactive`                                                                                                                                                                                                                            |
| passwordHash                   | String    | bcrypt                                                                                                                                                                                                                                          |
| passwordVersion                | Int       | Incremented on password change; invalidates old JWTs                                                                                                                                                                                            |
| emailVerified                  | Boolean   | Default false                                                                                                                                                                                                                                   |
| emailVerificationCodeHash      | String?   | bcrypt of 6-digit code                                                                                                                                                                                                                          |
| emailVerificationCodeExpiresAt | DateTime? | 15 min TTL                                                                                                                                                                                                                                      |
| resetPasswordCodeHash          | String?   |                                                                                                                                                                                                                                                 |
| resetPasswordCodeExpiresAt     | DateTime? | 10 min TTL                                                                                                                                                                                                                                      |
| **Relations**                  |           | `activitiesAsCoordinator`, `adminProfile`, `coordinatorProfile`, `applications`, `attendanceRecords`, `markedAttendance`, `sentMessages`, `receivedMessages`, `notifications`, `pushTokens`, `reviews`, `auditLogsAsActor`, `auditLogsAsTarget` |

### 2. `admins` — Admin profile

| Field       | Type      | Notes                              |
| ----------- | --------- | ---------------------------------- |
| id          | UUID      | PK                                 |
| userId      | UUID      | Unique, FK → users, CASCADE delete |
| permissions | String    | JSON string of permissions         |
| accessLevel | String    | Default `"full"`                   |
| lastLogin   | DateTime? |                                    |

### 3. `coordinators` — Coordinator profile

| Field          | Type    | Notes                              |
| -------------- | ------- | ---------------------------------- |
| id             | UUID    | PK                                 |
| userId         | UUID    | Unique, FK → users, CASCADE delete |
| department     | String? |                                    |
| specialization | String? |                                    |
| maxActivities  | Int     | Default 10                         |
| approvalLevel  | String  | Default `"standard"`               |

### 4. `categories` — Activity categories

| Field | Type   | Notes                                    |
| ----- | ------ | ---------------------------------------- |
| id    | UUID   | PK                                       |
| name  | String | Unique (e.g. Sports, Academic, Cultural) |

### 5. `activities` — Core activities

| Field           | Type    | Notes                                                              |
| --------------- | ------- | ------------------------------------------------------------------ |
| id              | UUID    | PK                                                                 |
| title           | String  |                                                                    |
| description     | String  |                                                                    |
| date            | Date    | Date only                                                          |
| time            | String  | e.g. "10:00 AM"                                                    |
| location        | String  |                                                                    |
| capacity        | Int     | Max participants                                                   |
| enrolled        | Int     | Current enrolled count, default 0                                  |
| coordinatorId   | UUID    | FK → users                                                         |
| coordinatorName | String  | Denormalized for quick display                                     |
| status          | Enum    | `upcoming`, `ongoing`, `completed`                                 |
| category        | String  |                                                                    |
| image           | String? |                                                                    |
| latitude        | Float?  | For QR geolocation check                                           |
| longitude       | Float?  |                                                                    |
| qrCodeSecret    | String? | UUID, can be rotated to invalidate old QR codes                    |
| radius          | Int?    | Default 100 (meters)                                               |
| **Relations**   |         | `coordinator`, `applications`, `attendance`, `messages`, `reviews` |

### 6. `applications` — Student applications

| Field         | Type    | Notes                                                    |
| ------------- | ------- | -------------------------------------------------------- |
| id            | UUID    | PK                                                       |
| studentId     | UUID    | FK → users                                               |
| studentName   | String  | Denormalized                                             |
| activityId    | UUID    | FK → activities                                          |
| activityTitle | String  | Denormalized                                             |
| appliedAt     | Date    | Date only                                                |
| status        | Enum    | `pending`, `approved`, `rejected`, `waitlisted`          |
| notes         | String? | Coordinator notes                                        |
| isAdmin       | Boolean | Can manage group chat, default false                     |
| **Unique**    |         | `(studentId, activityId)` — one application per activity |
| **Relations** |         | `activity`, `student`, `attendance`                      |

### 7. `attendance` — Attendance records

| Field         | Type   | Notes                                                           |
| ------------- | ------ | --------------------------------------------------------------- |
| id            | UUID   | PK                                                              |
| activityId    | UUID   | FK → activities                                                 |
| studentId     | UUID   | FK → users                                                      |
| studentName   | String | Denormalized                                                    |
| applicationId | UUID   | Unique, FK → applications                                       |
| status        | Enum   | `present`, `absent`                                             |
| markedAt      | Date   |                                                                 |
| markedBy      | UUID   | FK → users (who marked it)                                      |
| **Unique**    |        | `(activityId, studentId)` — one record per student per activity |

### 8. `notifications` — In-app notifications

| Field       | Type    | Notes                                                           |
| ----------- | ------- | --------------------------------------------------------------- |
| id          | UUID    | PK                                                              |
| title       | String  |                                                                 |
| message     | String  |                                                                 |
| type        | Enum    | `approval`, `rejection`, `announcement`, `reminder`, `waitlist` |
| read        | Boolean | Default false                                                   |
| createdAt   | Date    |                                                                 |
| senderRole  | Enum?   | Who triggered it                                                |
| recipientId | UUID    | FK → users                                                      |

### 9. `messages` — Chat messages

| Field      | Type     | Notes                                     |
| ---------- | -------- | ----------------------------------------- |
| id         | UUID     | PK                                        |
| content    | String   |                                           |
| type       | Enum     | `text`, `audio`, `image`, `video`, `file` |
| metadata   | JSON?    | File metadata etc.                        |
| senderId   | UUID     | FK → users                                |
| receiverId | UUID?    | Null for group messages                   |
| groupId    | UUID?    | FK → activities (group chat)              |
| read       | Boolean  | Default false                             |
| replyTo    | JSON?    | Quoted message reference                  |
| hiddenBy   | String[] | User IDs who hid this message             |
| isDeleted  | Boolean  | Default false                             |

### 10. `push_tokens` — Expo push tokens

| Field  | Type   | Notes                      |
| ------ | ------ | -------------------------- |
| id     | UUID   | PK                         |
| token  | String | Unique, Expo push token    |
| userId | UUID   | FK → users, CASCADE delete |

### 11. `audit_logs` — Audit trail

| Field    | Type    | Notes                                                                                                                                                                                                                                                                                                                         |
| -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id       | UUID    | PK                                                                                                                                                                                                                                                                                                                            |
| action   | Enum    | `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`, `USER_STATUS_TOGGLE`, `USER_ROLE_CHANGE`, `ACTIVITY_CREATE`, `ACTIVITY_UPDATE`, `ACTIVITY_DELETE`, `APPLICATION_CREATE`, `APPLICATION_STATUS_UPDATE`, `APPLICATION_DELETE`, `ATTENDANCE_MARK`, `NOTIFICATION_CREATE`, `NOTIFICATION_MARK_READ` |
| actorId  | UUID?   | User who performed action                                                                                                                                                                                                                                                                                                     |
| targetId | UUID?   | User who was acted upon                                                                                                                                                                                                                                                                                                       |
| entity   | String? | e.g. "activity", "user"                                                                                                                                                                                                                                                                                                       |
| entityId | String? |                                                                                                                                                                                                                                                                                                                               |
| message  | String? | Human-readable description                                                                                                                                                                                                                                                                                                    |
| metadata | JSONB?  | Extra data                                                                                                                                                                                                                                                                                                                    |

### 12. `pending_users` — Pre-registration holding

| Field                     | Type     | Notes                  |
| ------------------------- | -------- | ---------------------- |
| id                        | UUID     | PK                     |
| email                     | String   | Unique                 |
| name                      | String   |                        |
| passwordHash              | String   | bcrypt                 |
| role                      | String   | Default `"student"`    |
| studentId                 | String?  |                        |
| department                | String?  |                        |
| avatar                    | String?  |                        |
| verificationCodeHash      | String   | bcrypt of 6-digit code |
| verificationCodeExpiresAt | DateTime | 15 min TTL             |

---

## API Endpoints (all under `/api`)

### Health & Root

| Method | Path      | Auth | Description       |
| ------ | --------- | ---- | ----------------- |
| GET    | `/`       | No   | HTML landing page |
| GET    | `/health` | No   | JSON health check |

### Auth (`/auth`)

| Method | Path                        | Auth | Description                                 |
| ------ | --------------------------- | ---- | ------------------------------------------- |
| POST   | `/auth/login`               | No   | Email + password → JWT                      |
| POST   | `/auth/register`            | No   | Register student → pending_user + send code |
| POST   | `/auth/google`              | No   | Google credential → JWT                     |
| POST   | `/auth/verify-email`        | No   | 6-digit code → activate + JWT               |
| POST   | `/auth/resend-verification` | No   | Resend verification code                    |
| POST   | `/auth/forgot-password`     | No   | Send reset code to email                    |
| POST   | `/auth/reset-password`      | No   | Code + new password → reset                 |
| GET    | `/auth/me`                  | JWT  | Current user info                           |

### Users (`/users`)

| Method | Path                    | Auth | Role  | Description             |
| ------ | ----------------------- | ---- | ----- | ----------------------- |
| GET    | `/users`                | JWT  | admin | List all users          |
| GET    | `/users/me`             | JWT  | all   | Own profile             |
| PATCH  | `/users/me`             | JWT  | all   | Update own profile      |
| POST   | `/users/me/avatar`      | JWT  | all   | Upload avatar image     |
| PATCH  | `/users/me/password`    | JWT  | all   | Change own password     |
| GET    | `/users/chat-directory` | JWT  | all   | User directory for chat |
| GET    | `/users/:id`            | JWT  | all   | User by ID              |
| POST   | `/users`                | JWT  | admin | Create user             |
| PUT    | `/users/:id`            | JWT  | admin | Update user             |
| PATCH  | `/users/:id/password`   | JWT  | admin | Reset user password     |
| PATCH  | `/users/:id/status`     | JWT  | admin | Toggle active/inactive  |
| DELETE | `/users/:id`            | JWT  | admin | Delete user             |

### Activities (`/activities`)

| Method | Path                                | Auth | Role              | Description                                      |
| ------ | ----------------------------------- | ---- | ----------------- | ------------------------------------------------ |
| GET    | `/activities`                       | No   | —                 | List (filter by status, category, coordinatorId) |
| GET    | `/activities/calendar/view`         | No   | —                 | Calendar format with approved count              |
| GET    | `/activities/calendar/user/:userId` | JWT  | all               | User's personal calendar                         |
| GET    | `/activities/calendar/export`       | No   | —                 | Download .ics iCal file                          |
| GET    | `/activities/:id`                   | No   | —                 | Activity details                                 |
| POST   | `/activities`                       | JWT  | admin/coordinator | Create activity                                  |
| PUT    | `/activities/:id`                   | JWT  | admin/coordinator | Update activity                                  |
| DELETE | `/activities/:id`                   | JWT  | admin/coordinator | Delete activity                                  |
| GET    | `/activities/:id/members`           | JWT  | all               | Members list with group admin status             |
| POST   | `/activities/:id/admin/:studentId`  | JWT  | all               | Toggle group admin                               |

### Applications (`/applications`)

| Method | Path                                | Auth | Role              | Description                   |
| ------ | ----------------------------------- | ---- | ----------------- | ----------------------------- |
| GET    | `/applications`                     | JWT  | all               | List (scoped by role)         |
| GET    | `/applications/attendance/approved` | JWT  | admin/coordinator | Approved students roster      |
| GET    | `/applications/stats/:activityId`   | JWT  | coordinator       | Stats per status              |
| GET    | `/applications/:id`                 | JWT  | all               | Application details           |
| POST   | `/applications`                     | JWT  | student           | Apply (auto-waitlist if full) |
| PUT    | `/applications/:id/status`          | JWT  | admin/coordinator | Approve/reject/waitlist       |
| DELETE | `/applications/:id`                 | JWT  | admin             | Delete application            |

### Attendance (`/attendance`)

| Method | Path                                  | Auth | Role        | Description                     |
| ------ | ------------------------------------- | ---- | ----------- | ------------------------------- |
| GET    | `/attendance`                         | JWT  | all         | List (scoped by role)           |
| GET    | `/attendance/stats/:activityId`       | JWT  | coordinator | Present/absent counts           |
| GET    | `/attendance/:id`                     | JWT  | all         | Single record                   |
| POST   | `/attendance`                         | JWT  | coordinator | Mark single                     |
| POST   | `/attendance/batch`                   | JWT  | coordinator | Batch mark                      |
| GET    | `/attendance/qr/generate/:activityId` | JWT  | coordinator | Generate QR token (5min JWT)    |
| POST   | `/attendance/qr/scan`                 | JWT  | student     | Scan QR → verify → mark present |

### Notifications (`/notifications`)

| Method | Path                          | Auth | Role        | Description                       |
| ------ | ----------------------------- | ---- | ----------- | --------------------------------- |
| GET    | `/notifications`              | JWT  | all         | List (scoped to own unless admin) |
| GET    | `/notifications/unread/count` | JWT  | all         | Unread count                      |
| POST   | `/notifications`              | JWT  | coordinator | Create notification               |
| PUT    | `/notifications/:id/read`     | JWT  | all         | Mark one as read                  |
| PUT    | `/notifications/read/all`     | JWT  | all         | Mark all as read                  |
| POST   | `/notifications/push-token`   | JWT  | all         | Register Expo push token          |
| DELETE | `/notifications/:id`          | JWT  | all         | Delete                            |

### Chat (`/chat`) — REST

| Method | Path                                | Auth | Description                             |
| ------ | ----------------------------------- | ---- | --------------------------------------- |
| GET    | `/chat/ping`                        | JWT  | Health                                  |
| GET    | `/chat/history/:otherUserId`        | JWT  | 1-to-1 messages                         |
| GET    | `/chat/ghistory/:groupId`           | JWT  | Group messages                          |
| GET    | `/chat/group-history-data/:groupId` | JWT  | Group messages (alias)                  |
| GET    | `/chat/recent`                      | JWT  | Unified recent chats list               |
| POST   | `/chat/read/:senderId`              | JWT  | Mark messages as read                   |
| POST   | `/chat/upload`                      | JWT  | Upload file (100MB max, MIME whitelist) |
| DELETE | `/chat/clear/:otherUserId`          | JWT  | Clear conversation                      |

### Chat — WebSocket (Socket.IO via `/socket.io`)

| Event            | Direction     | Payload                                                          | Description                   |
| ---------------- | ------------- | ---------------------------------------------------------------- | ----------------------------- |
| `sendMessage`    | Client→Server | `{ receiverId?, groupId?, content, type?, replyTo?, metadata? }` | Send message → DB + broadcast |
| `joinGroup`      | Client→Server | `{ groupId }`                                                    | Join group room               |
| `typing`         | Client→Server | `{ receiverId?, groupId? }`                                      | Broadcast typing indicator    |
| `stopTyping`     | Client→Server | `{ receiverId?, groupId? }`                                      | Stop typing                   |
| `recording`      | Client→Server | `{ receiverId?, groupId? }`                                      | Broadcast recording indicator |
| `stopRecording`  | Client→Server | `{ receiverId?, groupId? }`                                      | Stop recording                |
| `deleteMessage`  | Client→Server | `{ messageId, receiverId?, groupId?, deleteType? }`              | Delete/hide message           |
| `newMessage`     | Server→Client | Message object                                                   | Incoming message              |
| `messageSent`    | Server→Client | Message object                                                   | Confirmation to sender        |
| `messageDeleted` | Server→Client | `{ messageId, deleteType, ... }`                                 | Message deleted               |
| `userOnline`     | Server→Client | `{ userId }`                                                     | User came online              |
| `userOffline`    | Server→Client | `{ userId }`                                                     | User went offline             |
| `onlineUsers`    | Server→Client | `[userId, ...]`                                                  | Current online list           |
| `userTyping`     | Server→Client | `{ userId, groupId? }`                                           | Someone is typing             |
| `userStopTyping` | Server→Client | `{ userId, groupId? }`                                           | Stopped typing                |

### Categories (`/categories`)

| Method | Path          | Auth | Role              | Description     |
| ------ | ------------- | ---- | ----------------- | --------------- |
| GET    | `/categories` | No   | —                 | List all        |
| POST   | `/categories` | JWT  | admin/coordinator | Create category |

### Audit Logs (`/audit-logs`)

| Method | Path          | Auth | Role  | Description                                                             |
| ------ | ------------- | ---- | ----- | ----------------------------------------------------------------------- |
| GET    | `/audit-logs` | JWT  | admin | Query with filters (q, action, actorId, targetId, from, to, skip, take) |

---
