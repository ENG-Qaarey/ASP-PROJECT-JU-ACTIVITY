# Calendar Integration Feature - Implementation Guide

**Feature:** Calendar Integration & Views  
**Implementation Date:** February 18, 2026  
**Status:** ✅ Complete

---

## 🎯 Feature Overview

This document outlines the complete implementation of calendar integration for JU Activity Hub, enabling users to:

1. View activities in calendar format (month/week/day views)
2. Export activities to external calendars (Google Calendar, Outlook, Apple Calendar)
3. Filter activities by category, status, and date range
4. Personal calendar view (user-specific activities)
5. All-activities calendar view (browse all events)

---

## 🏗️ Architecture

### Backend (NestJS + Prisma)

**New Endpoints:**

1. **GET `/api/activities/calendar/view`** - Get all activities in calendar format
   - Query params: `startDate`, `endDate`, `status`, `category`
   - Returns: Array of calendar events

2. **GET `/api/activities/calendar/user/:userId`** - Get user-specific calendar
   - Auth required
   - Returns: User's activities (as coordinator or participant)

3. **GET `/api/activities/calendar/export`** - Export calendar as iCal file
   - Query params: `startDate`, `endDate`, `userId` (optional)
   - Returns: `.ics` file download

**Modified Files:**
- `backend/src/activities/activities.controller.ts` - Added 3 new endpoints

**Dependencies:**
- `ical-generator` - For creating iCal files

### Frontend - Web Dashboard (React + Vite)

**New Components:**

1. **ActivitiesCalendar** (`ju-activity/src/components/shared/ActivitiesCalendar.tsx`)
   - Reusable calendar component
   - Props: `userOnly` (boolean) - Show only user's activities
   - Features:
     - Month/Week/Day/Agenda views
     - Category and status filters
     - Event details modal
     - Export to iCal
     - Dark mode support

2. **StudentCalendar** (`ju-activity/src/pages/student/StudentCalendar.tsx`)
   - Student personal calendar page
   - Shows only user's enrolled activities

3. **AllActivitiesCalendar** (`ju-activity/src/pages/AllActivitiesCalendar.tsx`)
   - Browse all university activities
   - Available to all roles

**Modified Files:**
- `ju-activity/src/App.tsx` - Added calendar routes for all roles
- `ju-activity/src/index.css` - Added comprehensive calendar styling

**Dependencies:**
- `react-big-calendar` - Interactive calendar component
- `date-fns` - Date manipulation
- `ical-generator` - Client-side iCal generation

**Routes Added:**
- `/student/calendar` - Student personal calendar
- `/coordinator/calendar` - Coordinator personal calendar
- `/admin/calendar` - Admin all-activities calendar

### Frontend - Mobile App (React Native + Expo)

**New Screens:**

1. **CalendarScreen** (`mobile/app/(student)/calendar.tsx`)
   - Native mobile calendar using `react-native-calendars`
   - Features:
     - Multi-dot marking for multiple events per day
     - Color-coded status indicators
     - Activity list for selected date
     - iCal export with native sharing

**Dependencies:**
- `react-native-calendars` - Native calendar component
- `expo-file-system` - File downloads
- `expo-sharing` - Native sharing dialog

---

## 📱 User Flows

### 1. Student Views Personal Calendar

```
1. Student navigates to /student/calendar
2. Calendar loads with student's enrolled activities
3. Student can:
   - Switch between month/week/day views
   - Filter by category/status
   - Click event for details
   - Export to Google Calendar/Outlook/Apple Calendar
```

### 2. Coordinator Views Calendar

```
1. Coordinator navigates to /coordinator/calendar
2. Calendar shows:
   - Activities they're coordinating
   - Activities they're enrolled in
3. Can export all to external calendar
```

### 3. Admin Views All Activities

```
1. Admin navigates to /admin/calendar
2. Calendar shows ALL university activities
3. Can filter by category, status, date range
4. Export filtered results to iCal
```

### 4. Export to External Calendar

**Web:**
```
1. Click "Export iCal" button
2. Browser downloads .ics file
3. User opens file:
   - Google Calendar: Auto-imports
   - Outlook: Imports via dialog
   - Apple Calendar: Imports via dialog
4. Activities appear in user's external calendar
```

**Mobile:**
```
1. Tap "Export iCal" button
2. App downloads .ics file
3. Native sharing sheet appears
4. User selects:
   - Save to Files
   - Open in Calendar app
   - Share via email/messaging
5. Activities sync to device calendar
```

---

## 🎨 UI/UX Features

### Web Calendar

**Views:**
- **Month View** - See all activities in a month grid
- **Week View** - Weekly schedule with time slots
- **Day View** - Detailed daily schedule
- **Agenda View** - List of upcoming activities

**Interactions:**
- Click event → Event details modal
- Hover event → Tooltip with title
- Navigation buttons for previous/next period
- Today button to jump to current date

**Styling:**
- Color-coded by status:
  - Green: Upcoming
  - Orange: Ongoing
  - Gray: Completed
- Theme-aware (light/dark mode)
- Responsive design
- Smooth animations

### Mobile Calendar

**Features:**
- Native calendar feel
- Multi-dot indicators (multiple events per day)
- Pull-to-refresh
- Smooth scrolling
- Status legend
- Tap event card → Navigate to activity details

---

## 🔧 Technical Implementation Details

### Calendar Event Format

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date; // Combined date + time
  end: Date;   // Same as start (can add duration later)
  location: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  capacity: number;
  enrolled: number;
  availableSpots: number;
  coordinator: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  approvedStudents: number;
  image?: string;
  role?: 'coordinator' | 'participant'; // For user-specific calendar
}
```

### iCal File Structure

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//JU Activity Hub//EN
CALNAME:JU Activity Hub Calendar
X-WR-CALNAME:JU Activity Hub Calendar
X-WR-TIMEZONE:Asia/Riyadh

BEGIN:VEVENT
DTSTART:20260220T100000Z
DTEND:20260220T120000Z
SUMMARY:Science Workshop
DESCRIPTION:Hands-on science experiments...
LOCATION:Main Hall
CATEGORIES:Workshop
STATUS:CONFIRMED
ORGANIZER;CN=Dr. Ahmed:mailto:coordinator@ju-activity-hub.com
UID:activity-id@ju-activity-hub.com
END:VEVENT

END:VCALENDAR
```

### API Request Examples

**Get All Activities for February 2026:**
```http
GET /api/activities/calendar/view?startDate=2026-02-01&endDate=2026-02-28
```

**Get User Calendar:**
```http
GET /api/activities/calendar/user/user-id-123?startDate=2026-02-01&endDate=2026-03-31
Authorization: Bearer <token>
```

**Export User Calendar:**
```http
GET /api/activities/calendar/export?userId=user-id-123
```

**Export Filtered Calendar:**
```http
GET /api/activities/calendar/export?startDate=2026-02-01&endDate=2026-02-28&category=Workshop&status=upcoming
```

---

## 🚀 Deployment & Configuration

### Environment Variables

**Backend:**
```env
# No new environment variables needed
# Timezone is hardcoded in iCal export (Asia/Riyadh)
# Update in activities.controller.ts if needed
```

**Web:**
```env
VITE_API_URL=http://localhost:3001/api  # Or production URL
```

**Mobile:**
```typescript
// Update API_URL in CalendarScreen.tsx
const API_URL = 'https://your-production-api.com/api';
```

### Build & Deploy

**Backend:**
```bash
cd backend
npm install ical-generator
npm run build
npm run start:prod
```

**Web:**
```bash
cd ju-activity
npm install react-big-calendar date-fns ical-generator
npm run build
# Deploy dist/ to Vercel, Netlify, etc.
```

**Mobile:**
```bash
cd mobile
npx expo install react-native-calendars
# Development
npm start

# Production
eas build -p android
eas build -p ios
```

---

## 📊 Performance Considerations

### Backend

**Query Optimization:**
- Date range filters use indexed `date` field
- User calendar queries use relations (already indexed)
- iCal export streams large datasets

**Caching:**
- Consider caching iCal files for static date ranges
- Redis cache for frequently accessed calendars

### Frontend

**Web:**
- Calendar events lazy loaded by visible range
- Modal opens on demand (not pre-rendered)
- Export generates file client-side (no server load)

**Mobile:**
- Activities fetched once on mount
- Marked dates computed once
- Native calendar component is performant

---

## 🧪 Testing

### Backend Tests

```typescript
describe('Calendar Endpoints', () => {
  it('should return calendar events for date range', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/activities/calendar/view')
      .query({ startDate: '2026-02-01', endDate: '2026-02-28' });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should return user-specific calendar', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/activities/calendar/user/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
  });

  it('should export iCal file', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/activities/calendar/export');
    
    expect(response.headers['content-type']).toContain('text/calendar');
    expect(response.text).toContain('BEGIN:VCALENDAR');
  });
});
```

### Frontend Tests

```typescript
describe('ActivitiesCalendar', () => {
  it('should render calendar', () => {
    render(<ActivitiesCalendar />);
    expect(screen.getByText('Activities Calendar')).toBeInTheDocument();
  });

  it('should filter by category', async () => {
    render(<ActivitiesCalendar />);
    const filter = screen.getByRole('combobox', { name: /category/i });
    fireEvent.change(filter, { target: { value: 'Workshop' } });
    // Assert filtered results
  });
});
```

---

## 📖 User Documentation

### How to Export to Google Calendar

1. Click "Export iCal" button
2. Save the `.ics` file to your computer
3. Go to Google Calendar (calendar.google.com)
4. Click the "+" icon next to "Other calendars"
5. Select "Import"
6. Choose the downloaded `.ics` file
7. Select which calendar to add events to
8. Click "Import"

### How to Export to Outlook

1. Click "Export iCal" button
2. Save the `.ics` file
3. Open Outlook
4. Go to File → Open & Export → Import/Export
5. Choose "Import an iCalendar (.ics) or vCalendar file"
6. Select the downloaded file
7. Click "Import"

### How to Export to Apple Calendar

1. Click "Export iCal" button
2. The `.ics` file will download
3. Double-click the file
4. Apple Calendar will open automatically
5. Choose which calendar to add events to
6. Click "OK"

---

## 🐛 Known Issues & Limitations

1. **Event Duration:** Currently set to 2 hours by default
   - **Fix:** Add `duration` field to Activity model
   
2. **Timezone Handling:** Hardcoded to `Asia/Riyadh`
   - **Fix:** Make timezone configurable per user

3. **Export Limit:** No pagination on export (could be slow for thousands of events)
   - **Fix:** Add pagination or streaming

4. **Real-time Updates:** Calendar doesn't auto-refresh
   - **Fix:** Add WebSocket support or polling

---

## 🔮 Future Enhancements

### Phase 2 Features

1. **Calendar Sync (Two-way)**
   - Sync with Google Calendar API
   - Automatic updates when activities change

2. **Recurring Activities**
   - Support for repeating events
   - Series management

3. **Calendar Sharing**
   - Share calendar with others
   - Public calendar URLs

4. **Reminders**
   - Email/SMS reminders before activities
   - Customizable reminder times

5. **Time Zone Support**
   - User-specific timezone
   - Automatic conversion

6. **Multi-Calendar View**
   - Overlay multiple calendars
   - Color-coding by source

---

## 📝 Maintenance Notes

### Regular Tasks

- **Monthly:** Review calendar performance metrics
- **Quarterly:** Update iCal library to latest version
- **Yearly:** Audit timezone database

### Monitoring

- Track export download counts
- Monitor calendar API response times
- Log errors in iCal generation

---

## ✅ Checklist

- [x] Backend API endpoints implemented
- [x] iCal export functionality
- [x] Web calendar component created
- [x] Mobile calendar screen created
- [x] Calendar styling (light & dark mode)
- [x] Routes added to all user roles
- [x] Filters implemented (category, status)
- [x] Event details modal
- [x] Documentation created
- [ ] Unit tests written
- [ ] E2E tests written
- [ ] User acceptance testing
- [ ] Production deployment

---

## 📞 Support

For questions or issues:
- Backend: Check `backend/src/activities/activities.controller.ts`
- Web: Check `ju-activity/src/components/shared/ActivitiesCalendar.tsx`
- Mobile: Check `mobile/app/(student)/calendar.tsx`

**Generated by:** Antigravity AI  
**Date:** February 18, 2026  
**Version:** 1.0.0
