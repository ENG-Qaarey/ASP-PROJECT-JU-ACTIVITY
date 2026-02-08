# Real Mobile Push Notifications Design (Expo + NestJS)

This document explains how real push notifications are implemented in JU-Activity Hub using **Expo Push Notifications**.

## 🚀 How it Works
1.  **Permission & Token**: When the user logs into the mobile app, the app requests permission. If granted, it fetches a unique `ExpoPushToken`.
2.  **Registration**: The app sends this token to the NestJS backend via `POST /notifications/push-token`.
3.  **Storage**: The backend stores the token in the `push_tokens` table in PostgreSQL, linked to the `User`.
4.  **Triggering**: When an event happens (Chat, Approval, Reminder), the backend calls the `NotificationsService`.
5.  **Delivery**: The backend uses the `expo-server-sdk` to send the notification to Expo's Push Service, which delivers it to Apple (APNs) or Google (FCM).

---

## 🛠 Required Database Changes
A new table `PushToken` was added to track multiple devices per user:
```prisma
model PushToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([userId])
}
```

---

## 📦 Backend Implementation (NestJS)
### 1. Notifications Service
The service now handles both database notifications (for the in-app inbox) and real-time Pushes.
- **`registerPushToken(userId, token)`**: Saves/Updates tokens.
- **`sendPush(recipientId, title, body, data)`**: The engine that communicates with Expo.

### 2. Triggers
- **Applications**: Approval and Rejection trigger a push automatically when the status is updated.
- **Chat**: New 1-to-1 messages trigger a push if the recipient is not currently online in the Socket.io gateway.

---

## 📱 Mobile Implementation (Expo)
### 1. NotificationService.ts
A dedicated utility that:
- Requests OS-level permissions.
- Retrieves the `ExpoPushToken`.
- Configures Android Channels (for high-priority alerts).

### 2. Auth Integration
The token is synchronized automatically in `AuthContext.tsx` as soon as a user session is detected.

---

## 🔒 Security & Permissions
- **Authenticated Only**: Users must be logged in to register a push token.
- **OS Permission**: Users can toggle notifications at the system level.
- **Token Validity**: The backend checks `Expo.isExpoPushToken(token)` before trying to send.

---

## 📖 Example Use Cases

### 1. Application Approval
- **Event**: Coordinator clicks "Approve".
- **Push**: *"Application Approved! Your application for 'Science Fair' has been approved!"*
- **Data**: `{ type: 'approval', activityId: '...' }`

### 2. New Chat Messages
- **Event**: User A sends a message to User B.
- **Push**: *"New message from Ahmed: Hey, what time are we meeting?"*
- **Data**: `{ type: 'chat', senderId: '...' }`

### 3. Activity Reminders (Upcoming)
- **Logic**: Use a Cron job (NestJS `@Schedule`) to scan for activities starting in 1 hour.
- **Push**: *"Reminder: 'Science Fair' starts in 1 hour at the Main Hall."*
