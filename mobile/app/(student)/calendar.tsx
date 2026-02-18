import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../../src/context/AuthContext';
import { client } from '../../src/lib/api';
import { BASE_URL } from '../../src/lib/config';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface Activity {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  time: string;
  location: string;
  category: string;
  status: string;
  coordinator: {
    name: string;
  };
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);

  const fetchActivities = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await client.get(`/activities/calendar/user/${user.id}`);
      setActivities(data);

      // Create marked dates
      const marked: any = {};
      data.forEach((activity: any) => {
        const dateKey = activity.start.split('T')[0];
        if (!marked[dateKey]) {
          marked[dateKey] = {
            marked: true,
            dots: [],
          };
        }
        
        // Color by status
        let color = '#10b981'; // green for upcoming
        if (activity.status === 'ongoing') color = '#f59e0b'; // orange
        if (activity.status === 'completed') color = '#6b7280'; // gray

        marked[dateKey].dots.push({ color });
      });

      setMarkedDates(marked);
      
      // If a date was already selected, update the filtered list
      if (selectedDate) {
        const filtered = data.filter(
          (activity: any) => activity.start.split('T')[0] === selectedDate
        );
        setSelectedActivities(filtered);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedDate]);

  useEffect(() => {
    fetchActivities();
  }, [user?.id]);

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);

    // Filter activities for selected date
    const filtered = activities.filter(
      (activity) => activity.start.split('T')[0] === day.dateString
    );
    setSelectedActivities(filtered);
  };

  const exportCalendar = async () => {
    try {
      const url = `${BASE_URL}/activities/calendar/export?userId=${user?.id}`;

      // Download iCal file
      const fileUri = `${(FileSystem as any).documentDirectory}ju-activities.ics`;
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        // Share the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'text/calendar',
            dialogTitle: 'Export Calendar',
          });
        } else {
          alert('Calendar exported successfully!');
        }
      }
    } catch (error) {
      console.error('Error exporting calendar:', error);
      alert('Failed to export calendar');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#10b981';
      case 'ongoing':
        return '#f59e0b';
      case 'completed':
        return '#6b7280';
      default:
        return '#3b82f6';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Calendar</Text>
        <TouchableOpacity style={styles.exportButton} onPress={exportCalendar}>
          <Text style={styles.exportButtonText}>Export iCal</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: '#3b82f6',
          },
        }}
        markingType={'multi-dot'}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#374151',
          selectedDayBackgroundColor: '#3b82f6',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3b82f6',
          dayTextColor: '#1f2937',
          textDisabledColor: '#d1d5db',
          dotColor: '#3b82f6',
          selectedDotColor: '#ffffff',
          arrowColor: '#3b82f6',
          monthTextColor: '#1f2937',
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 14,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
      />

      {/* Selected Date Activities */}
      {selectedDate && (
        <View style={styles.activitiesContainer}>
          <Text style={styles.sectionTitle}>
            Activities on {dayjs(selectedDate).format('MMMM D, YYYY')}
          </Text>

          {selectedActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No activities on this date</Text>
            </View>
          ) : (
            selectedActivities.map((activity) => (
  <TouchableOpacity
                key={activity.id}
                style={styles.activityCard}
                onPress={() => router.push(`/(student)/details?id=${activity.id}`)}
              >
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(activity.status) },
                  ]}
                />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>
                    {activity.time} • {activity.location}
                  </Text>
                  <Text style={styles.activityCategory}>{activity.category}</Text>
                  <Text style={styles.activityCoordinator}>
                    Coordinator: {activity.coordinator.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Status Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Upcoming</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Ongoing</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6b7280' }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  exportButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  calendar: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activitiesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityCategory: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 4,
  },
  activityCoordinator: {
    fontSize: 12,
    color: '#9ca3af',
  },
  legend: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
