# JU Activity Hub — Backend Full Analysis

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (TypeScript) |
| Framework | NestJS v11 |
| ORM | Prisma v7 |
| Database | PostgreSQL (via `pg` pool + `@prisma/adapter-pg`) |
| Auth | JWT (jsonwebtoken, bcrypt) |
| Real-time | Socket.IO (via `@nestjs/websockets` + `@nestjs/platform-socket.io`) |
| Email | Nodemailer (SMTP) |
| Push Notifications | Expo Server SDK |
| File Upload | Multer (disk storage to `uploads/`) |
| Scheduling | `@nestjs/schedule` (cron) |
| iCal Export | `ical-generator` |
| Google Auth | `google-auth-library` |

---

## Entry Point — `src/main.ts`

- Loads `.env` via `dotenv` before everything
- Boots NestJS with `AppModule`
- Sets body size limit to **100MB**
- Creates `uploads/` dir if missing; serves it as static files at `/uploads`
- **CORS**: Allows localhost, 127.0.0.1, `::1`, private IPv4 ranges (10.x, 172.16-31.x, 192.168.x), ngrok hostnames in dev. Uses `FRONTEND_URLS` or `FRONTEND_URL` env var in production.
- Global prefix: `/api` (except root `/`)
- Listens on `PORT` (default 3001), binds `0.0.0.0`

---

## Architecture Diagram

```
AppModule
├── ConfigModule (global .env)
├── ScheduleModule (cron)
├── AuthzModule (JWT + Roles guards)
├── PrismaModule (singleton PrismaClient)
├── AuthModule (login, register, verify, OAuth)
├── UsersModule (CRUD, avatar, status, chat directory)
├── AdminsModule (admin profile CRUD)
├── CoordinatorsModule (coordinator profile CRUD)
├── ActivitiesModule (CRUD, calendar, iCal, status auto-update)
├── ApplicationsModule (apply, approve/reject, waitlist)
├── AttendanceModule (mark, batch, QR scan)
├── NotificationsModule (in-app + push via Expo)
├── ChatModule (REST history) + ChatGateway (WebSocket real-time)
├── AuditLogsModule (admin queryable audit trail)
├── CategoriesModule (activity categories CRUD)
├── MailModule (nodemailer SMTP with HTML templates)
└── RemindersModule (cron: activity reminders T-24h)
```

---

## Authentication Flow

### Register
1. Client sends `POST /api/auth/register` with name, email, password
2. Server validates only `student` role can self-register
3. Generates 6-digit verification code, bcrypt-hashes it
4. Stores in `pending_users` table (upsert — allows retry)
5. Sends verification email via nodemailer
6. Response: `{ success: true, email }`

### Verify Email
1. Client sends `POST /api/auth/verify-email` with email + 6-digit code
2. Checks `pending_users` first (new flow):
   - Validates code expiration (15 min)
   - Validates code hash (bcrypt.compare)
   - Creates permanent `users` row with `status: 'active', emailVerified: true`
   - Deletes from `pending_users`
3. Falls back to `users` table (legacy/re-verification flow)
4. Returns JWT token (7-day expiry)

### Login
1. `POST /api/auth/login` with email + password
2. Normalizes email (trim + lowercase)
3. Looks up user via `UsersService.findByEmail()` (exact match → case-insensitive fallback)
4. bcrypt.compare password hash
5. Checks `user.status === 'active'`
6. Signs JWT with: `{ sub, email, role, pv (passwordVersion) }`
7. Creates audit log entries for success/failure

### Google Sign-In
1. `POST /api/auth/google` with Google credential token
2. Verifies via `OAuth2Client.verifyIdToken()`
3. Auto-creates account if new, or updates existing
4. Returns JWT

### Password Reset
1. `POST /api/auth/forgot-password` → generates 6-digit code (10min expiry) → sends email
2. `POST /api/auth/reset-password` → verifies code → hashes new password → resets `passwordVersion` (invalidates all existing JWTs)

### JWT Guard (`src/authz/jwt-auth.guard.ts`)
- Extracts `Bearer` token from `Authorization` header
- Verifies JWT signature with `JWT_SECRET`
- Fetches user from DB by `payload.sub`
- **Password version check**: Compares `user.passwordVersion` with `payload.pv` — rejects if they differ (old tokens invalidated)
- Attaches full user object to `req.user`

### Roles Guard (`src/authz/roles.guard.ts`)
- Checks `@Roles()` decorator metadata
- **Admin always passes** regardless of required roles
- Otherwise requires exact role match

---

## Database Tables (11 models + 1 enum-backed)

### 1. `users` — Core user accounts
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | String | |
| email | String | Unique, normalized lowercase |
| role | Enum | `student`, `coordinator`, `admin` |
| studentId | String? | University ID |
| avatar | String? | URL path |
| department | String? | |
| joinedAt | Date? | |
| status | Enum | `active`, `inactive` |
| passwordHash | String | bcrypt |
| passwordVersion | Int | Incremented on password change; invalidates old JWTs |
| emailVerified | Boolean | Default false |
| emailVerificationCodeHash | String? | bcrypt of 6-digit code |
| emailVerificationCodeExpiresAt | DateTime? | 15 min TTL |
| resetPasswordCodeHash | String? | |
| resetPasswordCodeExpiresAt | DateTime? | 10 min TTL |
| **Relations** | | `activitiesAsCoordinator`, `adminProfile`, `coordinatorProfile`, `applications`, `attendanceRecords`, `markedAttendance`, `sentMessages`, `receivedMessages`, `notifications`, `pushTokens`, `reviews`, `auditLogsAsActor`, `auditLogsAsTarget` |

### 2. `admins` — Admin profile
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | Unique, FK → users, CASCADE delete |
| permissions | String | JSON string of permissions |
| accessLevel | String | Default `"full"` |
| lastLogin | DateTime? | |

### 3. `coordinators` — Coordinator profile
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | Unique, FK → users, CASCADE delete |
| department | String? | |
| specialization | String? | |
| maxActivities | Int | Default 10 |
| approvalLevel | String | Default `"standard"` |

### 4. `categories` — Activity categories
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | String | Unique (e.g. Sports, Academic, Cultural) |

### 5. `activities` — Core activities
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| title | String | |
| description | String | |
| date | Date | Date only |
| time | String | e.g. "10:00 AM" |
| location | String | |
| capacity | Int | Max participants |
| enrolled | Int | Current enrolled count, default 0 |
| coordinatorId | UUID | FK → users |
| coordinatorName | String | Denormalized for quick display |
| status | Enum | `upcoming`, `ongoing`, `completed` |
| category | String | |
| image | String? | |
| latitude | Float? | For QR geolocation check |
| longitude | Float? | |
| qrCodeSecret | String? | UUID, can be rotated to invalidate old QR codes |
| radius | Int? | Default 100 (meters) |
| **Relations** | | `coordinator`, `applications`, `attendance`, `messages`, `reviews` |

### 6. `applications` — Student applications
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| studentId | UUID | FK → users |
| studentName | String | Denormalized |
| activityId | UUID | FK → activities |
| activityTitle | String | Denormalized |
| appliedAt | Date | Date only |
| status | Enum | `pending`, `approved`, `rejected`, `waitlisted` |
| notes | String? | Coordinator notes |
| isAdmin | Boolean | Can manage group chat, default false |
| **Unique** | | `(studentId, activityId)` — one application per activity |
| **Relations** | | `activity`, `student`, `attendance` |

### 7. `attendance` — Attendance records
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| activityId | UUID | FK → activities |
| studentId | UUID | FK → users |
| studentName | String | Denormalized |
| applicationId | UUID | Unique, FK → applications |
| status | Enum | `present`, `absent` |
| markedAt | Date | |
| markedBy | UUID | FK → users (who marked it) |
| **Unique** | | `(activityId, studentId)` — one record per student per activity |

### 8. `notifications` — In-app notifications
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| title | String | |
| message | String | |
| type | Enum | `approval`, `rejection`, `announcement`, `reminder`, `waitlist` |
| read | Boolean | Default false |
| createdAt | Date | |
| senderRole | Enum? | Who triggered it |
| recipientId | UUID | FK → users |

### 9. `messages` — Chat messages
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| content | String | |
| type | Enum | `text`, `audio`, `image`, `video`, `file` |
| metadata | JSON? | File metadata etc. |
| senderId | UUID | FK → users |
| receiverId | UUID? | Null for group messages |
| groupId | UUID? | FK → activities (group chat) |
| read | Boolean | Default false |
| replyTo | JSON? | Quoted message reference |
| hiddenBy | String[] | User IDs who hid this message |
| isDeleted | Boolean | Default false |

### 10. `push_tokens` — Expo push tokens
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| token | String | Unique, Expo push token |
| userId | UUID | FK → users, CASCADE delete |

### 11. `audit_logs` — Audit trail
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| action | Enum | `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`, `USER_STATUS_TOGGLE`, `USER_ROLE_CHANGE`, `ACTIVITY_CREATE`, `ACTIVITY_UPDATE`, `ACTIVITY_DELETE`, `APPLICATION_CREATE`, `APPLICATION_STATUS_UPDATE`, `APPLICATION_DELETE`, `ATTENDANCE_MARK`, `NOTIFICATION_CREATE`, `NOTIFICATION_MARK_READ` |
| actorId | UUID? | User who performed action |
| targetId | UUID? | User who was acted upon |
| entity | String? | e.g. "activity", "user" |
| entityId | String? | |
| message | String? | Human-readable description |
| metadata | JSONB? | Extra data |

### 12. `pending_users` — Pre-registration holding
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | String | Unique |
| name | String | |
| passwordHash | String | bcrypt |
| role | String | Default `"student"` |
| studentId | String? | |
| department | String? | |
| avatar | String? | |
| verificationCodeHash | String | bcrypt of 6-digit code |
| verificationCodeExpiresAt | DateTime | 15 min TTL |

---

## API Endpoints (all under `/api`)

### Health & Root
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | No | HTML landing page |
| GET | `/health` | No | JSON health check |

### Auth (`/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | No | Email + password → JWT |
| POST | `/auth/register` | No | Register student → pending_user + send code |
| POST | `/auth/google` | No | Google credential → JWT |
| POST | `/auth/verify-email` | No | 6-digit code → activate + JWT |
| POST | `/auth/resend-verification` | No | Resend verification code |
| POST | `/auth/forgot-password` | No | Send reset code to email |
| POST | `/auth/reset-password` | No | Code + new password → reset |
| GET | `/auth/me` | JWT | Current user info |

### Users (`/users`)
| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/users` | JWT | admin | List all users |
| GET | `/users/me` | JWT | all | Own profile |
| PATCH | `/users/me` | JWT | all | Update own profile |
| POST | `/users/me/avatar` | JWT | all | Upload avatar image |
| PATCH | `/users/me/password` | JWT | all | Change own password |
| GET | `/users/chat-directory` | JWT | all | User directory for chat |
| GET | `/users/:id` | JWT | all | User by ID |
| POST | `/users` | JWT | admin | Create user |
| PUT | `/users/:id` | JWT | admin | Update user |
| PATCH | `/users/:id/password` | JWT | admin | Reset user password |
| PATCH | `/users/:id/status` | JWT | admin | Toggle active/inactive |
| DELETE | `/users/:id` | JWT | admin | Delete user |

### Activities (`/activities`)
| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/activities` | No | — | List (filter by status, category, coordinatorId) |
| GET | `/activities/calendar/view` | No | — | Calendar format with approved count |
| GET | `/activities/calendar/user/:userId` | JWT | all | User's personal calendar |
| GET | `/activities/calendar/export` | No | — | Download .ics iCal file |
| GET | `/activities/:id` | No | — | Activity details |
| POST | `/activities` | JWT | admin/coordinator | Create activity |
| PUT | `/activities/:id` | JWT | admin/coordinator | Update activity |
| DELETE | `/activities/:id` | JWT | admin/coordinator | Delete activity |
| GET | `/activities/:id/members` | JWT | all | Members list with group admin status |
| POST | `/activities/:id/admin/:studentId` | JWT | all | Toggle group admin |

### Applications (`/applications`)
| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/applications` | JWT | all | List (scoped by role) |
| GET | `/applications/attendance/approved` | JWT | admin/coordinator | Approved students roster |
| GET | `/applications/stats/:activityId` | JWT | coordinator | Stats per status |
| GET | `/applications/:id` | JWT | all | Application details |
| POST | `/applications` | JWT | student | Apply (auto-waitlist if full) |
| PUT | `/applications/:id/status` | JWT | admin/coordinator | Approve/reject/waitlist |
| DELETE | `/applications/:id` | JWT | admin | Delete application |

### Attendance (`/attendance`)
| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/attendance` | JWT | all | List (scoped by role) |
| GET | `/attendance/stats/:activityId` | JWT | coordinator | Present/absent counts |
| GET | `/attendance/:id` | JWT | all | Single record |
| POST | `/attendance` | JWT | coordinator | Mark single |
| POST | `/attendance/batch` | JWT | coordinator | Batch mark |
| GET | `/attendance/qr/generate/:activityId` | JWT | coordinator | Generate QR token (5min JWT) |
| POST | `/attendance/qr/scan` | JWT | student | Scan QR → verify → mark present |

### Notifications (`/notifications`)
| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/notifications` | JWT | all | List (scoped to own unless admin) |
| GET | `/notifications/unread/count` | JWT | all | Unread count |
| POST | `/notifications` | JWT | coordinator | Create notification |
| PUT | `/notifications/:id/read` | JWT | all | Mark one as read |
| PUT | `/notifications/read/all` | JWT | all | Mark all as read |
| POST | `/notifications/push-token` | JWT | all | Register Expo push token |
| DELETE | `/notifications/:id` | JWT | all | Delete |

### Chat (`/chat`) — REST
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/chat/ping` | JWT | Health |
| GET | `/chat/history/:otherUserId` | JWT | 1-to-1 messages |
| GET | `/chat/ghistory/:groupId` | JWT | Group messages |
| GET | `/chat/group-history-data/:groupId` | JWT | Group messages (alias) |
| GET | `/chat/recent` | JWT | Unified recent chats list |
| POST | `/chat/read/:senderId` | JWT | Mark messages as read |
| POST | `/chat/upload` | JWT | Upload file (100MB max, MIME whitelist) |
| DELETE | `/chat/clear/:otherUserId` | JWT | Clear conversation |

### Chat — WebSocket (Socket.IO via `/socket.io`)
| Event | Direction | Payload | Description |
|---|---|---|---|
| `sendMessage` | Client→Server | `{ receiverId?, groupId?, content, type?, replyTo?, metadata? }` | Send message → DB + broadcast |
| `joinGroup` | Client→Server | `{ groupId }` | Join group room |
| `typing` | Client→Server | `{ receiverId?, groupId? }` | Broadcast typing indicator |
| `stopTyping` | Client→Server | `{ receiverId?, groupId? }` | Stop typing |
| `recording` | Client→Server | `{ receiverId?, groupId? }` | Broadcast recording indicator |
| `stopRecording` | Client→Server | `{ receiverId?, groupId? }` | Stop recording |
| `deleteMessage` | Client→Server | `{ messageId, receiverId?, groupId?, deleteType? }` | Delete/hide message |
| `newMessage` | Server→Client | Message object | Incoming message |
| `messageSent` | Server→Client | Message object | Confirmation to sender |
| `messageDeleted` | Server→Client | `{ messageId, deleteType, ... }` | Message deleted |
| `userOnline` | Server→Client | `{ userId }` | User came online |
| `userOffline` | Server→Client | `{ userId }` | User went offline |
| `onlineUsers` | Server→Client | `[userId, ...]` | Current online list |
| `userTyping` | Server→Client | `{ userId, groupId? }` | Someone is typing |
| `userStopTyping` | Server→Client | `{ userId, groupId? }` | Stopped typing |

### Categories (`/categories`)
| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/categories` | No | — | List all |
| POST | `/categories` | JWT | admin/coordinator | Create category |

### Audit Logs (`/audit-logs`)
| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/audit-logs` | JWT | admin | Query with filters (q, action, actorId, targetId, from, to, skip, take) |

---

## Key Features & Design Decisions

### 1. Password Version Invalidation
- `passwordVersion` integer increments on password change/reset
- JWT payload includes `pv` field
- `JwtAuthGuard` compares DB `user.passwordVersion` with token's `pv`
- Old tokens become invalid immediately — no need for token blacklist

### 2. Two-Phase Registration
- Registration creates `pending_users` row (not `users`)
- Email verification moves row to `users` table
- `pending_users` upsert allows retrying registration with same email

### 3. Auto Waitlist with FIFO Processing
- If activity is full (`enrolled >= capacity`), application status = `waitlisted`
- When a spot opens (rejection, deletion, status change):
  - `processWaitlist()` finds earliest waitlisted by `appliedAt`
  - Promotes to `pending` status
  - Sends notification to student
  - Pending applications are still subject to coordinator review

### 4. QR Code Attendance with Geolocation
- Coordinator generates a timed JWT token (5min expiry)
- Token contains `activityId` + `qrCodeSecret`
- Student scans → server verifies:
  - JWT signature & expiry
  - Token's `activityId` matches
  - Token's `secret` matches current activity `qrCodeSecret` (rotation support)
  - **Optional**: Haversine distance check if activity has `latitude/longitude/radius`
  - Student has approved application
- Marks attendance as `present` by coordinator ID

### 5. Auto Activity Status Transitions
- `ActivitiesService.onModuleInit()` starts a `setInterval` every 60 seconds
- Finds all upcoming/ongoing activities
- Parses `date` + `time` → compares with current time
- Transitions: `upcoming → ongoing` (at start), `ongoing/completed` (after 2h default duration)

### 6. Activity-Based Chat Visibility
- `getUserGroups()` returns group IDs for user's approved applications + coordinated activities
- On WebSocket connect, user joins `group_{activityId}` rooms
- `recent chats` aggregates both 1-to-1 and group messages
- Chat directory (`/users/chat-directory`) restricts student visibility to:
  - Admins
  - Users sharing approved applications or coordinated activities

### 7. Rich Email Templates
- `MailService` sends HTML emails with:
  - Verification codes (6 styled digit boxes)
  - Application approved/rejected with status indicator
  - Activity reminders with date/time/location cards
- Falls back to `console.log` if SMTP not configured

### 8. Push Notifications via Expo
- `NotificationsService` uses `expo-server-sdk`
- Tokens stored in `push_tokens` table
- Sends ExpoPushMessage chunks (max 100 per chunk)
- Sent on: activity creation, application submission, status changes, reminders, chat messages

### 9. Audit Trail
- All significant actions logged to `audit_logs` table
- Audit actions are typed (enum with 16 values)
- Admin-only query endpoint with raw SQL JOINs for actor/target details
- **Best-effort**: failures never break the core flow

### 10. Cascading Deletion
- Deleting a user with `coordinator` role cascades to their activities, applications, attendance
- Deleting an activity requires pending applications resolved first (unless admin)
- Transaction ensures atomic cleanup

### 11. Calendar & iCal Export
- Calendar view returns activities as calendar events with start/end
- User-specific calendar shows both coordinated and participated activities
- iCal export (`/activities/calendar/export`) downloads `.ics` file with 2-hour default duration, status mapping, organizer info

### 12. Scheduled Reminders
- `@Cron(CronExpression.EVERY_HOUR)` checks for activities starting in ~24h
- Sends push notification + email to all approved students
- Uses `date` range matching (not exact timestamp)

---

## File Structure

```
backend/
├── src/
│   ├── main.ts                          # Bootstrap, CORS, static files
│   ├── app.module.ts                    # Root module (imports all)
│   ├── app.controller.ts                # GET /, GET /health
│   ├── app.service.ts                   # Landing page HTML + health JSON
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts            # PrismaClient with pg adapter
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts           # /auth endpoints
│   │   ├── auth.service.ts              # Login, register, OAuth, verify, reset password
│   │   └── email-verification.mailer.ts # Legacy email sender
│   ├── authz/
│   │   ├── authz.module.ts
│   │   ├── jwt-auth.guard.ts            # JWT verification + password version check
│   │   ├── roles.guard.ts               # Role-based access (admin bypass)
│   │   └── roles.decorator.ts           # @Roles('admin', 'coordinator')
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts          # /users CRUD, avatar, chat directory
│   │   └── users.service.ts             # Business logic, email normalization, cascading delete
│   ├── activities/
│   │   ├── activities.module.ts
│   │   ├── activities.controller.ts     # CRUD + calendar + iCal + members + group admin
│   │   └── activities.service.ts        # Auto status updates, create/update/delete with audit
│   ├── applications/
│   │   ├── applications.module.ts
│   │   ├── applications.controller.ts   # CRUD + status update + stats
│   │   └── applications.service.ts      # Apply, approve/reject, waitlist FIFO
│   ├── attendance/
│   │   ├── attendance.module.ts
│   │   ├── attendance.controller.ts     # Mark, batch, QR gen/scan
│   │   └── attendance.service.ts        # Upsert, QR JWT verification, Haversine distance
│   ├── chat/
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts           # REST: history, recent, upload, read, clear
│   │   ├── chat.service.ts              # Message CRUD, recent chats aggregation
│   │   └── chat.gateway.ts              # WebSocket: real-time messaging, typing, online status
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts  # CRUD, unread count, push token
│   │   └── notifications.service.ts     # In-app + Expo push, batch creation
│   ├── admins/
│   │   ├── admins.module.ts
│   │   └── admins.service.ts            # Admin profile CRUD
│   ├── coordinators/
│   │   ├── coordinators.module.ts
│   │   └── coordinators.service.ts      # Coordinator profile CRUD
│   ├── audit-logs/
│   │   ├── audit-logs.module.ts
│   │   ├── audit-logs.controller.ts     # GET /audit-logs (admin only)
│   │   └── audit-logs.service.ts        # Raw SQL query with JOINs + inserts
│   ├── categories/
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts     # GET + POST
│   │   └── categories.service.ts        # CRUD
│   ├── reminders/
│   │   ├── reminders.module.ts
│   │   └── reminders.service.ts         # Cron: T-24h push + email reminders
│   └── mail/
│       ├── mail.module.ts
│       └── mail.service.ts             # Nodemailer: verification, status update, reminder templates
├── prisma/
│   ├── schema.prisma                   # Full schema (11 models + enums)
│   ├── seed.ts                         # Database seed script
│   └── migrations/                     # Prisma migration files
├── uploads/                            # Uploaded files (avatars, chat media)
├── test/                               # E2E tests
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env.example
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs |
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | No | — | `production` disables permissive dev CORS |
| `FRONTEND_URLS` | No | localhost:8080,5173 | Comma-separated allowed CORS origins |
| `SMTP_HOST` | No | — | SMTP server hostname |
| `SMTP_PORT` | No | 587 | SMTP port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `SMTP_FROM` | No | SMTP_USER | Sender email address |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `APP_NAME` | No | JU Activity Hub | App name in emails |
| `BCRYPT_ROUNDS` | No | 10 | bcrypt salt rounds (clamped 8-14) |
| `FRONTEND_URL` | No | http://localhost:8080 | Frontend URL for email links |

---

## Enums

```typescript
enum UserRole { student, coordinator, admin }
enum UserStatus { active, inactive }
enum ActivityStatus { upcoming, ongoing, completed }
enum ApplicationStatus { pending, approved, rejected, waitlisted }
enum AttendanceStatus { present, absent }
enum MessageType { text, audio, image, video, file }
enum NotificationType { approval, rejection, announcement, reminder, waitlist }
enum AuditAction {
  LOGIN_SUCCESS, LOGIN_FAILURE,
  USER_CREATE, USER_UPDATE, USER_DELETE,
  USER_STATUS_TOGGLE, USER_ROLE_CHANGE,
  ACTIVITY_CREATE, ACTIVITY_UPDATE, ACTIVITY_DELETE,
  APPLICATION_CREATE, APPLICATION_STATUS_UPDATE, APPLICATION_DELETE,
  ATTENDANCE_MARK,
  NOTIFICATION_CREATE, NOTIFICATION_MARK_READ
}
```
