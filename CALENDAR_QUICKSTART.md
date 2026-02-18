# Quick Reference: Adding Calendar Links to Dashboards

## Student Dashboard

Add calendar link/button to `ju-activity/src/pages/student/StudentDashboard.tsx`:

```typescript
import { CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Inside component:
const navigate = useNavigate();

// Add this card to the dashboard:
<Card className="glass-card p-6 cursor-pointer hover:shadow-lg transition-all"
      onClick={() => navigate('/student/calendar')}>
  <div className="flex items-center gap-4">
    <CalendarIcon className="h-12 w-12 text-primary" />
    <div>
      <h3 className="text-lg font-semibold">My Calendar</h3>
      <p className="text-sm text-muted-foreground">
        View your activity schedule
      </p>
    </div>
  </div>
</Card>
```

## Mobile - Student Home

Add calendar button to `mobile/app/(student)/(tabs)/home.tsx`:

```typescript
import { Calendar } from 'lucide-react-native';
import { router } from 'expo-router';

// Add this TouchableOpacity:
<TouchableOpacity
  style={styles.calendarButton}
  onPress={() => router.push('/(student)/calendar')}
>
  <Calendar size={24} color="#3b82f6" />
  <Text style={styles.calendarText}>My Calendar</Text>
</TouchableOpacity>
```

## API Endpoints Summary

**Backend endpoints available:**

1. `GET /api/activities/calendar/view` - All activities calendar
2. `GET /api/activities/calendar/user/:userId` - User calendar (auth required)
3. `GET /api/activities/calendar/export` - Download iCal file

**Usage in component:**

```typescript
// Fetch calendar data
const fetchCalendar = async () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/activities/calendar/user/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  // data is array of calendar events
};

// Export calendar
const exportCalendar = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const url = `${API_URL}/activities/calendar/export?userId=${userId}`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ju-activities.ics';
  link.click();
};
```

## Testing the Feature

1. **Start Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start Web:**
   ```bash
   cd ju-activity
   npm run dev
   ```

3. **Test URLs:**
   - Student Calendar: http://localhost:5173/student/calendar
   - Admin Calendar: http://localhost:5173/admin/calendar
   - API Test: http://localhost:3001/api/activities/calendar/view

4. **Test Export:**
   - Click "Export iCal" button
   - File should download as `ju-activities.ics`
   - Open with Google Calendar/Outlook/Apple Calendar

## Common Issues

**Issue:** Calendar doesn't show events
- **Fix:** Check that activities exist in database with dates
- **Fix:** Verify API_URL is correct in component

**Issue:** Export button doesn't work
- **Fix:** Check CORS settings in backend
- **Fix:** Verify export endpoint is accessible

**Issue:** Date format errors
- **Fix:** Ensure activity dates are in valid Date format
- **Fix:** Check timezone settings
