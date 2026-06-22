import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Download, Filter, MapPin, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API, STORAGE_KEYS } from '@/constants/api';
import { ACTIVITY_STATUS } from '@/constants/status';
import { UI } from '@/constants/ui';
import { ROUTES } from '@/constants/routes';

import { enUS } from 'date-fns/locale';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  location: string;
  category: string;
  status: string;
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
}

interface ActivitiesCalendarProps {
  userOnly?: boolean; // If true, show only user's activities
}

export default function ActivitiesCalendar({ userOnly = false }: ActivitiesCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const API_URL = API.BASE_URL;
      
      // Calculate date range based on current view
      const startDate = new Date(date);
      const endDate = new Date(date);
      
      if (view === 'month') {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      } else if (view === 'week') {
        const day = startDate.getDay();
        startDate.setDate(startDate.getDate() - day);
        endDate.setDate(endDate.getDate() + (6 - day));
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      if (categoryFilter && categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const endpoint = userOnly && user
        ? `${API_URL}/activities/calendar/user/${user.id}?${params}`
        : `${API_URL}/activities/calendar/view?${params}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (userOnly && user) {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(endpoint, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      
      // Transform data to calendar events
      const calendarEvents = data.map((activity: any) => ({
        ...activity,
        start: new Date(activity.start),
        end: new Date(activity.end),
      }));

      setEvents(calendarEvents);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load calendar activities',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [date, view, categoryFilter, statusFilter, userOnly, user, toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const exportToCalendar = async () => {
    try {
      const API_URL = API.BASE_URL;
      const params = new URLSearchParams();
      
      if (userOnly && user) {
        params.append('userId', user.id);
      }

      const url = `${API_URL}/activities/calendar/export?${params}`;
      
      // Download the iCal file
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ju-activities.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: 'Calendar exported successfully! You can now import it into Google Calendar, Outlook, or Apple Calendar.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export calendar',
        variant: 'destructive',
      });
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // default blue

    // Color by status
    if (event.status === ACTIVITY_STATUS.UPCOMING) {
      backgroundColor = '#10b981';
    } else if (event.status === ACTIVITY_STATUS.ONGOING) {
      backgroundColor = '#f59e0b';
    } else if (event.status === ACTIVITY_STATUS.COMPLETED) {
      backgroundColor = '#6b7280';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <h2 className="text-xl font-semibold">
              {userOnly ? 'My Calendar' : 'Activities Calendar'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Workshop">Workshop</SelectItem>
                <SelectItem value="Seminar">Seminar</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Conference">Conference</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button onClick={exportToCalendar} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export iCal
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <Card className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            view={view}
            date={date}
            eventPropGetter={eventStyleGetter}
            popup
            views={['month', 'week', 'day', 'agenda']}
            tooltipAccessor={(event) => event.title}
          />
        )}
      </Card>

      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              <div className="space-y-4 mt-4">
                {/* Status Badge */}
                <div>
                  <Badge
                    variant={
                      selectedEvent?.status === ACTIVITY_STATUS.UPCOMING
                        ? 'default'
                        : selectedEvent?.status === ACTIVITY_STATUS.ONGOING
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {selectedEvent?.status}
                  </Badge>
                  <Badge variant="outline" className="ml-2">
                    {selectedEvent?.category}
                  </Badge>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedEvent?.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold">Date & Time</p>
                      <p className="text-sm">
                        {selectedEvent?.start &&
                          format(selectedEvent.start, 'PPP p')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold">Location</p>
                      <p className="text-sm">{selectedEvent?.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold">Capacity</p>
                      <p className="text-sm">
                        {selectedEvent?.enrolled} / {selectedEvent?.capacity}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold">Available Spots</p>
                      <p className="text-sm">{selectedEvent?.availableSpots}</p>
                    </div>
                  </div>
                </div>

                {/* Coordinator */}
                {selectedEvent?.coordinator && (
                  <div>
                    <h4 className="font-semibold mb-2">Coordinator</h4>
                    <div className="flex items-center gap-2">
                      {selectedEvent.coordinator.avatar && (
                        <img
                          src={selectedEvent.coordinator.avatar}
                          alt={selectedEvent.coordinator.name}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {selectedEvent.coordinator.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedEvent.coordinator.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  className="w-full"
                    onClick={() => {
                    selectedEvent?.id && navigate(ROUTES.STUDENT.ACTIVITY_DETAILS(selectedEvent.id));
                  }}
                >
                  View Details
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
