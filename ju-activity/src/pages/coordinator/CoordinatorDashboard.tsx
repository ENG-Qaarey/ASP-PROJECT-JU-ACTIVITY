import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { CoordinatorOverview } from "@/components/coordinator/CoordinatorOverview";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ROUTES } from "@/constants/routes";
import {
  Calendar,
  FileText,
  Users,
  CheckCircle,
  Download,
  Plus,
  Clock,
  ArrowRight
} from "lucide-react";

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const { activities, applications, isLoading } = useActivity();
  const navigate = useNavigate();

  const toDateOnly = (value?: string) => {
    if (!value) return "";
    return value.includes("T") ? value.split("T")[0] : value;
  };

  const allActivities = activities;
  const pendingApplications = applications.filter((a) => a.status === "pending");
  const upcomingActivities = allActivities.filter((a) => a.status === "upcoming");
  const totalEnrolled = allActivities.reduce((sum, a) => sum + a.enrolled, 0);

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
                Welcome, Coordinator! 📋
              </h2>
              <p className="text-muted-foreground mt-1">Manage your activities and review student applications.</p>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-36 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="hidden sm:flex rounded-xl bg-background/50 backdrop-blur-sm" onClick={() => navigate("/coordinator/create-activity")}>
                <Plus className="mr-2 h-4 w-4" />
                New Activity
              </Button>
              <Button className="rounded-xl shadow-lg shadow-primary/20">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          )}
        </motion.div>
        <Tabs defaultValue="overview" className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-72 rounded-md" />
          ) : (
            <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
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
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-56" />
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
                            <Skeleton className="h-8 w-16 rounded-md" />
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
                      <CardTitle className="text-sm font-medium">All Activities</CardTitle>
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{allActivities.length}</div>
                      <p className="text-xs text-muted-foreground">+2 from last month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Upcoming Activities</CardTitle>
                      <div className="p-2 bg-warning/10 rounded-xl">
                        <FileText className="h-4 w-4 text-warning" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{upcomingActivities.length}</div>
                      <p className="text-xs text-muted-foreground">Scheduled for next 30 days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
                      <div className="p-2 bg-success/10 rounded-xl">
                        <Users className="h-4 w-4 text-success" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalEnrolled}</div>
                      <p className="text-xs text-muted-foreground">+12% growth</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Apps</CardTitle>
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{pendingApplications.length}</div>
                      <p className="text-xs text-muted-foreground">Requires your attention</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="lg:col-span-4">
                    <CardHeader>
                      <CardTitle>Application Volume</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <CoordinatorOverview />
                    </CardContent>
                  </Card>
                  
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle>Recent Pending Applications</CardTitle>
                      <CardDescription>
                        You have {pendingApplications.length} applications waiting.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {pendingApplications.slice(0, 5).map((application) => (
                          <div key={application.id} className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-warning/20 flex items-center justify-center mr-4">
                              <Clock className="w-4 h-4 text-warning" />
                            </div>
                            <div className="ml-0 space-y-1 flex-1 min-w-0">
                              <p className="text-sm font-medium leading-none truncate">{application.studentName}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {application.activityTitle}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.COORDINATOR.APPLICATIONS)}>
                              Review
                            </Button>
                          </div>
                        ))}
                        
                        {pendingApplications.length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            No pending applications.
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
                 <CardContent className="p-6">
                   <div className="space-y-4">
                     {[...Array(4)].map((_, i) => (
                       <Skeleton key={i} className="h-16 w-full" />
                     ))}
                   </div>
                 </CardContent>
               </Card>
             ) : (
               <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Your Activities</CardTitle>
                    <CardDescription>Manage and monitor your ongoing activities.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.COORDINATOR.ACTIVITIES)}>
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allActivities.slice(0, 4).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{activity.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {activity.enrolled}/{activity.capacity} enrolled
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {toDateOnly(activity.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
             )}
          </TabsContent>
          
          <TabsContent value="applications" className="space-y-4">
             {isLoading ? (
               <Card>
                 <CardHeader>
                   <Skeleton className="h-6 w-48" />
                   <Skeleton className="h-4 w-64" />
                 </CardHeader>
               </Card>
             ) : (
               <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate(ROUTES.COORDINATOR.APPLICATIONS)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Application Management</CardTitle>
                  <CardDescription>Review all applications in the dedicated management view</CardDescription>
                </CardHeader>
              </Card>
             )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
