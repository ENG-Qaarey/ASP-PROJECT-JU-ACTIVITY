# Chat Navigation Flow

## 📱 User Journey

### 1. **Tap Chat Icon** (in top navigation)
   - Shows pulsing green dot for online users
   - Shows red badge for unread messages
   - Located in header across all roles

### 2. **See Chat List** (`/chat/index.tsx`)
   ```
   ┌─────────────────────────┐
   │      Messages           │
   │  ┌─────────────────┐   │
   │  │ 🔍 Search       │   │
   │  └─────────────────┘   │
   │                         │
   │  👤 Design chat     4m  │
   │     Jessie sent...   🔴1│
   │                     📌  │
   │  ─────────────────────  │
   │  👤 Osman Campos   20m  │
   │  🟢 You: Hey! We...  ✓✓ │
   │                         │
   │  👤 Jayden Church   1h  │
   │     I prepared...    📌 │
   │                         │
   │  👤 Jacob Mcleod   10m  │
   │     And send...     🔴3 │
   └─────────────────────────┘
   ```

### 3. **Tap User** → Opens conversation (`/chat/[id].tsx`)
   ```
   ┌─────────────────────────┐
   │  ← Osman Campos 🟢      │
   │                         │
   │  👤 Hi Amin! I need the │
   │     latest report.      │
   │     09:43               │
   │                         │
   │              Sure, I'll │
   │              send it... │
   │              09:45 ✓    │
   │                         │
   │  [Type a message...]  ➤ │
   └─────────────────────────┘
   ```

## 🎨 Features

### Chat List Screen
- **Rounded square avatars** (56x56px, 12px radius)
- **Online indicators** (green dot bottom-right)
- **Unread badges** (orange circle with count)
- **Pin indicators** (📌 emoji)
- **Read receipts** (✓✓ for read, none for sent/unread)
- **Timestamps** (relative: 4m, 20m, 1h, 1d, 2d)
- **Message previews** (truncated at 1 line)
- **Search bar** (non-functional placeholder for now)
- **Smooth separators** (starting after avatar)

### Individual Chat Screen
- **Clean message bubbles** (fully rounded)
- **Light purple** for sent messages (#DDD6FE)
- **White** for received messages
- **Blue circle avatars** for received (40x40px)
- **Timestamps** outside bubbles
- **Typing indicators** (animated dots)
- **Online status** in header
- **Auto-scroll** to latest message

## 📂 File Structure

```
mobile/app/
  └── chat/
      ├── index.tsx       # Chat list (conversations)
      └── [id].tsx        # Individual chat screen
```

## 🔗 Navigation

```typescript
// Tap chat icon
router.push('/chat')  
// → Shows chat list

// Tap user in list
router.push('/chat/1')
// → Shows conversation with user ID 1
```

## 🎯 Design Principles

1. **Mobile-first** - Optimized for touch
2. **Minimal** - Clean, uncluttered interface
3. **Familiar** - Matches WhatsApp/Telegram patterns
4. **Responsive** - Adapts to dark/light themes
5. **Accessible** - Clear visual hierarchy

---

**Ready to test!** Tap the chat icon in your mobile app to see the conversation list! 🚀
