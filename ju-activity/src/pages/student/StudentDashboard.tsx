import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { StudentOverview } from "@/components/student/StudentOverview";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ROUTES } from "@/constants/routes";
import {
  Calendar,
  FileText,
  CheckCircle,
  Bell,
  ArrowRight,
  Clock,
  MapPin,
} from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { activities, applications, notifications, isLoading } = useActivity();
  const navigate = useNavigate();

  const formatDate = (value: string) => {
    if (!value) return value;
    return value.includes("T") ? value.slice(0, 10) : value;
  };

  const parseActivityDateTime = (dateValue: string, timeValue?: string) => {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return null;

    let hours = 0;
    let minutes = 0;

    const timeText = (timeValue ?? "").trim();
    if (timeText) {
      const match = timeText.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
      if (match) {
        hours = Number.parseInt(match[1], 10);
        minutes = Number.parseInt(match[2], 10);
        const meridiem = match[3]?.toLowerCase();
        if (meridiem) {
          if (hours === 12) hours = 0;
          if (meridiem === "pm") hours += 12;
        }
      }
    }

    return new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
      hours,
      minutes,
      0,
      0
    );
  };

  const now = new Date();

  const recentActivities = activities
    .map((activity) => ({
      activity,
      dateTime: parseActivityDateTime(activity.date, (activity as any).time),
    }))
    .filter(({ dateTime }) => dateTime !== null)
    .sort((a, b) => {
      if (!a.dateTime) return 1;
      if (!b.dateTime) return -1;
      return b.dateTime.getTime() - a.dateTime.getTime();
    })
    .map(({ activity }) => activity)
    .slice(0, 5);

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-[20px] border border-primary/10"
        >
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          ) : (
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome back, {(user?.name ?? "Student").split(" ")[0]}! 👋
              </h2>
              <p className="text-muted-foreground mt-1">Ready to explore new activities and enhance your university experience?</p>
            </div>
          )}
          {isLoading ? (
            <Skeleton className="h-10 w-36 rounded-xl" />
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="hidden sm:flex rounded-xl bg-background/50 backdrop-blur-sm" onClick={() => navigate(ROUTES.STUDENT.ACTIVITIES)}>
                <Calendar className="mr-2 h-4 w-4" />
                Browse Activities
              </Button>
            </div>
          )}
        </motion.div>
        <Tabs defaultValue="overview" className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-96 rounded-md" />
          ) : (
            <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="notifications">
                Notifications
                {unreadNotifications.length > 0 && (
                  <span className="ml-2 rounded-full bg-destructive w-2 h-2" />
                )}
              </TabsTrigger>
            </TabsList>
          )}
          
          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-10 rounded-xl" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-24 mb-1" />
                        <Skeleton className="h-3 w-40" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="lg:col-span-4">
                    <CardHeader>
                      <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent className="pl-2">
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-24 w-full" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center">
                            <Skeleton className="w-9 h-9 rounded-full mr-4" />
                            <div className="ml-0 space-y-1 flex-1 min-w-0">
                              <Skeleton className="h-4 w-3/4 mb-1" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                            <div className="ml-auto">
                              <Skeleton className="h-3 w-8" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Available Activities</CardTitle>
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{activities.length}</div>
                      <p className="text-xs text-muted-foreground">Activities open for enrollment</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Applied Activities</CardTitle>
                      <div className="p-2 bg-warning/10 rounded-xl">
                        <FileText className="h-4 w-4 text-warning" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{applications.length}</div>
                      <p className="text-xs text-muted-foreground">Total applications sent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Approved</CardTitle>
                      <div className="p-2 bg-success/10 rounded-xl">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {applications.filter((a) => a.status === "approved").length}
                      </div>
                      <p className="text-xs text-muted-foreground">Applications successfully accepted</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                      <div className="p-2 bg-destructive/10 rounded-xl">
                        <Bell className="h-4 w-4 text-destructive" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{unreadNotifications.length}</div>
                      <p className="text-xs text-muted-foreground">Requires your attention</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="lg:col-span-4">
                    <CardHeader>
                      <CardTitle>Activity History</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <StudentOverview />
                    </CardContent>
                  </Card>
                  
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle>Recent Activities</CardTitle>
                      <CardDescription>
                        Your most recent interactions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {recentActivities.map((activity) => (
                          <div key={activity.id} className="flex items-center" onClick={() => navigate(`/student/activities/${activity.id}`)} style={{ cursor: "pointer" }}>
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                              <Calendar className="w-4 h-4 text-primary" />
                            </div>
                            <div className="ml-0 space-y-1 flex-1 min-w-0">
                              <p className="text-sm font-medium leading-none truncate">{activity.title}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {formatDate(activity.date)}
                              </p>
                            </div>
                            <div className="ml-auto font-medium text-sm text-muted-foreground capitalize">
                               {activity.category}
                            </div>
                          </div>
                        ))}
                        
                        {recentActivities.length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            No recent activities.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
             {isLoading ? (
               <Card>
                 <CardHeader>
                   <Skeleton className="h-6 w-40" />
                   <Skeleton className="h-4 w-48" />
                 </CardHeader>
               </Card>
             ) : (
               <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate(ROUTES.STUDENT.ACTIVITIES)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Browse Activities</CardTitle>
                  <CardDescription>Find and enroll in new university activities.</CardDescription>
                </CardHeader>
              </Card>
             )}
          </TabsContent>
          
          <TabsContent value="applications" className="space-y-4">
             {isLoading ? (
               <Card>
                 <CardHeader>
                   <Skeleton className="h-6 w-40" />
                   <Skeleton className="h-4 w-48" />
                 </CardHeader>
               </Card>
             ) : (
               <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate(ROUTES.STUDENT.APPLICATIONS)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> My Applications</CardTitle>
                  <CardDescription>Review the status of your submitted applications.</CardDescription>
                </CardHeader>
              </Card>
             )}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="p-4 rounded-xl border">
                        <div className="flex items-start gap-4">
                          <Skeleton className="w-2 h-2 rounded-full mt-2" />
                          <div className="flex-1 min-w-0">
                            <Skeleton className="h-4 w-3/4 mb-1" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>System alerts and application updates.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.STUDENT.NOTIFICATIONS)}>
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      notification.read
                        ? "bg-background border-border"
                        : "bg-accent/50 border-primary/20"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        notification.type === "approval"
                          ? "bg-success"
                          : notification.type === "rejection"
                          ? "bg-destructive"
                          : "bg-primary"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">No notifications yet.</p>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
