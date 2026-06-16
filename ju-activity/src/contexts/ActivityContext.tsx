import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Application,
  Notification,
  mockActivities as mockActivitiesSeed,
  mockApplications as mockApplicationsSeed,
  mockNotifications as mockNotificationsSeed,
} from "@/data/mockData";
import { useAuth } from "./AuthContext";
import { toast } from "@/hooks/use-toast";
import { activitiesApi, applicationsApi, notificationsApi, attendanceApi, categoriesApi } from "@/lib/api";

type Attendance = {
  id: string;
  activityId: string;
  studentId: string;
  studentName: string;
  applicationId: string;
  status: "present" | "absent";
  markedBy: string;
  markedAt: string;
};

type CreateActivityInput = Pick<
  Activity,
  "title" | "description" | "date" | "time" | "location" | "capacity"
> & {
  category: string;
  // Admins can assign an activity to a coordinator; coordinators cannot spoof this (backend enforces).
  coordinatorId?: string;
};

/** Central data store for activities, applications, notifications, and attendance. */
interface ActivityContextType {
  activities: Activity[];
  categories: { id: string; name: string }[];
  applications: Application[];
  notifications: Notification[];
  attendance: Attendance[];
  isLoading: boolean;
  createActivity: (activity: CreateActivityInput) => Promise<Activity>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  createApplication: (application: Omit<Application, "id" | "appliedAt" | "status">) => Promise<Application>;
  updateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
  createNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => Promise<Notification>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  getActivityById: (id: string) => Activity | undefined;
  getApplicationsByActivity: (activityId: string) => Application[];
  getApplicationsByStudent: (studentId: string) => Application[];
  getUnreadNotificationsCount: () => number;
  getApprovedApplicationsByActivity: (activityId: string) => Application[];
  markAttendance: (activityId: string, studentId: string, status: "present" | "absent", markedBy: string) => Promise<void>;
  getAttendanceByActivity: (activityId: string) => Attendance[];
  refreshAttendanceForActivity: (activityId: string) => Promise<Attendance[]>;
  saveAttendanceBatch: (activityId: string, attendanceData: Record<string, "present" | "absent">, markedBy: string) => Promise<void>;
  clearAllActivityData: () => void;
  /** Re-fetch all data from the backend. */
  refreshData: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

/** Provides the central data store for activities, applications, notifications, and attendance.
 *  Fetches data from the backend on mount and subscribes to real-time updates via SignalR. */
export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /** Fetch all data when the user changes. */
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  /** Subscribe to real-time notifications and activity updates via SignalR. */
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    let connection: HubConnection;

    const startConnection = async () => {
      connection = new HubConnectionBuilder()
        .withUrl("/hubs/notifications", {
          accessTokenFactory: () => localStorage.getItem("token") ?? "",
        })
        .withAutomaticReconnect()
        .build();

      connection.on("NotificationReceived", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });

      connection.on("NotificationRead", (data: { id: string; recipientId: string }) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === data.id ? { ...n, read: true } : n))
        );
      });

      connection.on("AllNotificationsRead", (data: { recipientId: string }) => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.recipientId === data.recipientId ? { ...n, read: true } : n
          )
        );
      });

      connection.on("ApplicationUpdated", (application: Application) => {
        setApplications((prev) =>
          prev.map((a) => (a.id === application.id ? application : a))
        );
      });

      connection.on("ActivityUpdated", (activity: Activity) => {
        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? activity : a))
        );
      });

      connection.on("ActivityDeleted", (data: { id: string }) => {
        setActivities((prev) => prev.filter((a) => a.id !== data.id));
        setApplications((prev) => prev.filter((a) => a.activityId !== data.id));
      });

      try {
        await connection.start();
      } catch (err) {
        toast({ title: "Connection Failed", description: "Could not connect to the real-time server.", variant: "destructive" });
      }
    };

    startConnection();

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [user?.id, user?.role]);

  const useMockDataFallback = (currentUser: typeof user) => {
    const recipientId = currentUser?.id ?? "mock-recipient";
    const seededNotifications = mockNotificationsSeed.map((notif) => ({
      ...notif,
      recipientId,
    }));

    setActivities(mockActivitiesSeed);
    setApplications(mockApplicationsSeed);
    setNotifications(seededNotifications);
    setAttendance([]);
  };

  /** Fetch all data from the backend — activities, categories, applications, notifications, attendance. */
  const refreshData = async () => {
    if (!user) {
      setActivities([]);
      setCategories([]);
      setApplications([]);
      setNotifications([]);
      setAttendance([]);
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    const hasToken = Boolean(token);

    setIsLoading(true);
    try {
      const applicationsParams = user.role === "student"
        ? { studentId: user.id }
        : undefined;

      // Coordinators and admins can still manage only what they own (enforced by backend),
      // but we load all activities so the UI can offer an "All Activities" view.
      const activitiesParams = undefined;

      // Kick off requests in parallel so we can hydrate activities ASAP
      const activitiesPromise = activitiesApi.getAll(activitiesParams);
      const categoriesPromise = categoriesApi.getAll();
      const applicationsPromise = hasToken ? applicationsApi.getAll(applicationsParams) : Promise.resolve([]);
      const notificationsPromise = hasToken
        ? user.role === "admin"
          ? notificationsApi.getAll()
          : notificationsApi.getAll({ recipientId: user.id })
        : Promise.resolve([]);
      const attendancePromise = hasToken
        ? user.role === "student"
          ? attendanceApi.getAll({ studentId: user.id })
          : Promise.resolve([])
        : Promise.resolve([]);

      // Activities are needed for most screens (including attendance dropdown), so set them first.
      const activitiesData = await activitiesPromise;
      setActivities(activitiesData);
      
      const [applicationsData, notificationsData, attendanceData, categoriesData] = await Promise.all([
        applicationsPromise,
        notificationsPromise,
        attendancePromise,
        categoriesPromise
      ]);

      setApplications(applicationsData);
      setNotifications(notificationsData);
      setAttendance(attendanceData);
      setCategories(categoriesData);
    } catch (error) {
      toast({ title: "Failed to Load Data", description: "Could not fetch activities and notifications.", variant: "destructive" });
      setActivities([]);
      setCategories([]);
      setApplications([]);
      setNotifications([]);
      setAttendance([]);

    } finally {
      setIsLoading(false);
    }
  };

  /** Filter notifications visible to the current user based on their role. */
  const userNotifications = useMemo(() => {
    if (!user) return [];
    return notifications.filter((notif) => {
      // Students and Coordinators only see notifications addressed to them.
      if (user.role !== "admin") {
        return notif.recipientId === user.id;
      }

      // Admins see all notifications in the system EXCEPT student announcements.
      // This allows them to monitor application activities, approvals, etc.
      return notif.type !== "announcement";
    });
  }, [notifications, user]);

  /** Create a new activity (admin only). Returns the created activity. */
  const createActivity = async (
    activityData: CreateActivityInput
  ): Promise<Activity> => {
    if (!user) {
      throw new Error("You must be logged in to create an activity");
    }

    if (user.role !== "admin") {
      throw new Error("Only administrators can create activities");
    }
    
    try {
      const payload = {
        ...activityData,
        ...(user.role === "admin" && activityData.coordinatorId
          ? { coordinatorId: activityData.coordinatorId }
          : {}),
      };
      const newActivity = await activitiesApi.create(payload);

    setActivities((prev) => [...prev, newActivity]);

      // Create notifications for all students about the new activity
      // This would require fetching all students from the backend
      // For now, we'll skip automatic notifications or implement it separately

      return newActivity;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create activity");
    }
  };

  /** Update an existing activity's fields by ID. */
  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    try {
      const updated = await activitiesApi.update(id, updates);
    setActivities((prev) =>
        prev.map((activity) => (activity.id === id ? updated : activity))
    );
    } catch (error: any) {
      throw new Error(error.message || "Failed to update activity");
    }
  };

  /** Delete an activity and its associated applications. */
  const deleteActivity = async (id: string) => {
    try {
      await activitiesApi.delete(id);
    setActivities((prev) => prev.filter((activity) => activity.id !== id));
      // Applications are deleted on the backend via cascade
    setApplications((prev) => prev.filter((app) => app.activityId !== id));
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete activity");
    }
  };

  /** Submit a new application to an activity. */
  const createApplication = async (
    applicationData: Omit<Application, "id" | "appliedAt" | "status">
  ): Promise<Application> => {
    if (!user) {
      throw new Error("You must be logged in to apply for an activity");
    }

    try {
      // Check if activity exists
    const activity = activities.find((a) => a.id === applicationData.activityId);
    if (!activity) {
      throw new Error("Activity not found");
    }

      const newApplication = await applicationsApi.create({
      ...applicationData,
        studentId: user.id,
        studentName: user.name,
      });

    setApplications((prev) => [...prev, newApplication]);

      // Refresh activity to get updated enrolled count
      const updatedActivity = await activitiesApi.getById(applicationData.activityId);
      setActivities((prev) =>
        prev.map((a) => (a.id === applicationData.activityId ? updatedActivity : a))
      );

      return newApplication;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create application");
    }
  };

  const updateApplication = async (id: string, updates: Partial<Application>) => {
    try {
      if (updates.status) {
    const application = applications.find((app) => app.id === id);
        if (!application) {
          throw new Error("Application not found");
        }

        await applicationsApi.updateStatus(id, updates.status, updates.notes);

        // Refresh data to get updated state
        await refreshData();
      } else {
        // For other updates, you may need to add a separate endpoint
        throw new Error("Only status updates are supported");
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to update application");
    }
  };

  const createNotification = async (
    notificationData: Omit<Notification, "id" | "read" | "createdAt">
  ): Promise<Notification> => {
    try {
      const newNotification = await notificationsApi.create(notificationData);
    setNotifications((prev) => [newNotification, ...prev]);
    return newNotification;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create notification");
    }
  };

  /** Mark a single notification as read. */
  const markNotificationAsRead = async (id: string) => {
    if (!user) return;

    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => {
          if (notif.id === id) {
            // Admins can mark any notification read; others only their own.
            if (user.role === "admin" || notif.recipientId === user.id) {
              return { ...notif, read: true };
            }
          }
          return notif;
        })
      );
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to mark notification as read.", variant: "destructive" });
    }
  };

  /** Mark all notifications for the current user as read. */
  const markAllNotificationsAsRead = async () => {
    if (!user) return;

    try {
      await notificationsApi.markAllAsRead(user.id);
    setNotifications((prev) => 
      prev.map((notif) => 
          notif.recipientId === user.id ? { ...notif, read: true } : notif
      )
    );
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to mark all notifications as read.", variant: "destructive" });
    }
  };

  const getActivityById = (id: string): Activity | undefined => {
    return activities.find((activity) => activity.id === id);
  };

  const getApplicationsByActivity = (activityId: string): Application[] => {
    return applications.filter((app) => app.activityId === activityId);
  };

  const getApplicationsByStudent = (studentId: string): Application[] => {
    return applications.filter((app) => app.studentId === studentId);
  };

  const getUnreadNotificationsCount = (): number => {
    if (!user) return 0;
    return userNotifications.filter((notif) => !notif.read).length;
  };

  const getApprovedApplicationsByActivity = (activityId: string): Application[] => {
    return applications.filter(
      (app) => app.activityId === activityId && app.status === "approved"
    );
  };

  const markAttendance = async (
    activityId: string,
    studentId: string,
    status: "present" | "absent",
    markedBy: string
  ) => {
    const application = applications.find(
      (app) => app.activityId === activityId && app.studentId === studentId && app.status === "approved"
    );
    if (!application) {
      throw new Error("Application not found or not approved");
    }

    try {
      const student = applications.find(
        (app) => app.studentId === studentId
    );
      const studentName = student?.studentName || "Unknown";

      await attendanceApi.markAttendance({
        activityId,
        studentId,
        studentName,
        applicationId: application.id,
        status,
        markedBy,
      });

      // Refresh attendance data
      const attendanceData = await attendanceApi.getAll({ activityId });
      setAttendance((prev) => {
        const otherActivityAttendance = prev.filter((a) => a.activityId !== activityId);
        return [...otherActivityAttendance, ...attendanceData];
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark attendance");
    }
  };

  const getAttendanceByActivity = useCallback(
    (activityId: string): Attendance[] => {
      return attendance.filter((a) => a.activityId === activityId);
    },
    [attendance]
  );

  const refreshAttendanceForActivity = useCallback(async (activityId: string): Promise<Attendance[]> => {
    try {
      const attendanceData = await attendanceApi.getAll({ activityId });
      setAttendance((prev) => {
        const otherActivityAttendance = prev.filter((a) => a.activityId !== activityId);
        return [...otherActivityAttendance, ...attendanceData];
      });
      return attendanceData;
    } catch (error: any) {
      throw new Error(error.message || "Failed to load attendance");
    }
  }, []);

  const saveAttendanceBatch = async (
    activityId: string,
    attendanceData: Record<string, "present" | "absent">,
    markedBy: string
  ) => {
    if (!user) {
      throw new Error("You must be logged in to mark attendance");
    }

    try {
      // Convert record to array format
      const attendanceArray = Object.entries(attendanceData).map(([studentId, status]) => {
        const application = applications.find(
          (app) => app.activityId === activityId && app.studentId === studentId && app.status === "approved"
        );
        if (!application) {
          throw new Error(`Application not found for student ${studentId}`);
        }

        const student = applications.find((app) => app.studentId === studentId);
        return {
          studentId,
          studentName: student?.studentName || "Unknown",
          applicationId: application.id,
          status,
        };
      });

      await attendanceApi.batchMarkAttendance({
        activityId,
        attendanceData: attendanceArray,
        markedBy,
      });

      // Refresh attendance data
      const updatedAttendance = await attendanceApi.getAll({ activityId });
      setAttendance((prev) => {
        const otherActivityAttendance = prev.filter((a) => a.activityId !== activityId);
        return [...otherActivityAttendance, ...updatedAttendance];
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to save attendance");
    }
  };

  const clearAllActivityData = () => {
    // This is for testing/development only
    // In production, data should be managed through the backend
    setActivities([]);
    setApplications([]);
    setNotifications([]);
    setAttendance([]);
  };

  const value = useMemo(
    () => ({
      activities,
      categories,
      applications,
      notifications: userNotifications,
      attendance,
      isLoading,
      createActivity,
      updateActivity,
      deleteActivity,
      createApplication,
      updateApplication,
      createNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      getActivityById,
      getApplicationsByActivity,
      getApplicationsByStudent,
      getUnreadNotificationsCount,
      getApprovedApplicationsByActivity,
      markAttendance,
      getAttendanceByActivity,
      refreshAttendanceForActivity,
      saveAttendanceBatch,
      clearAllActivityData,
      refreshData,
    }),
    [activities, categories, applications, userNotifications, attendance, isLoading, user]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
};
