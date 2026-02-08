# Chat Media (Images, Videos, Documents)

## Overview

Chat supports **images**, **videos**, and **documents** (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP). Media is uploaded via multipart/form-data, stored on the backend, and delivered in real time via Socket.io.

## Flow

### 1. Selecting media (Mobile)

- **Images / Videos**: `expo-image-picker` — `launchImageLibraryAsync` or `launchCameraAsync` with `mediaTypes: ['images', 'videos']`. User picks image or video; we get `uri`, optional `fileName`, `fileSize`, and `type` (image/video).
- **Documents**: `expo-document-picker` — `getDocumentAsync({ type: '*/*', copyToCacheDirectory: true })`. User picks a file; we get `uri`, `name`, `size`.

### 2. Upload (multipart/form-data)

- Build `FormData` and append one field: `file` with `{ uri, name, type }` where `type` is the MIME (e.g. `image/jpeg`, `video/mp4`, `application/pdf`).
- **Do not** set `Content-Type` header so the client can set `multipart/form-data` with boundary.
- `POST /api/chat/upload` returns `{ url, mimetype, size }`. `url` is a path like `/uploads/chat-media-xxx.jpg`.

### 3. Backend (NestJS)

- **Endpoint**: `POST /chat/upload` with `FileInterceptor('file', { storage, limits, fileFilter })`.
- **Storage**: `diskStorage` with `destination: path.join(process.cwd(), 'uploads')` and a unique filename (`chat-media-{timestamp}-{random}.{ext}`).
- **Limits**: 10 MB max.
- **Validation**: Only allowed MIME types (images, video, audio, PDF, Office, TXT, ZIP). Others get `400 File type not allowed`.
- **Static serving**: `app.use('/uploads', express.static(uploadsPath))` in `main.ts` (no `/api` prefix).

### 4. Database & real-time

- **Message**: `content` = file URL path (e.g. `/uploads/chat-media-xxx.jpg`), `type` = `image` | `video` | `file` | `audio`, `metadata` = `{ fileName?, fileSize?, fileExt?, pdfPages? }`.
- **Socket**: After upload, client calls `sendMessage(chatId, fileUrl, type, replyTo, metadata)`. Backend saves the message and emits `newMessage` / `messageSent` with full message (including `metadata`).

### 5. Display (Mobile)

- **Image**: `PremiumMessageBubble` shows `<Image source={{ uri: IMAGE_BASE + content }} />`; tap opens zoom viewer.
- **Video**: Shown as a “Video” card; tap opens URL via `Linking.openURL(IMAGE_BASE + content)` (external player/browser).
- **File**: Document card with icon, fileName, fileSize, fileExt; tap opens URL.

## Size & validation

- **Limit**: 10 MB per file (backend and mobile should keep in sync).
- **Types**: Backend whitelist of MIME types; mobile sends correct MIME from picker/ext.
- **Security**: No executable types; only common media and documents.

## Base URL

- Media URLs are stored as paths (e.g. `/uploads/...`). Client uses `IMAGE_BASE` (same host as API, no `/api`) to build full URL: `IMAGE_BASE + url`.
