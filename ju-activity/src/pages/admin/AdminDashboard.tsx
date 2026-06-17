import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { Overview } from "@/components/admin/Overview";
import { RecentActivity } from "@/components/admin/RecentActivity";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "@/hooks/use-toast";
import {
  Users,
  UserCheck,
  UserX,
  Percent,
  Download,
  Calendar,
  Activity,
  ClipboardList
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    activePercentage: 0,
    loading: true
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const stats = await userService.getUserStats();
        setUserStats(prev => ({
          ...stats,
          loading: false
        }));
      } catch {
        toast({ title: "Error", description: "Failed to load user statistics.", variant: "destructive" });
        setUserStats(prev => ({
          ...prev,
          loading: false
        }));
      }
    };

    fetchUserStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-[20px] border border-primary/10"
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome back, Admin! 👋
            </h2>
            <p className="text-muted-foreground mt-1">Here's what's happening with your system today.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="hidden sm:flex rounded-xl bg-background/50 backdrop-blur-sm">
              <Calendar className="mr-2 h-4 w-4" />
              Jan 20, 2026 - Feb 09, 2026
            </Button>
            <Button className="rounded-xl shadow-lg shadow-primary/20">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </motion.div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userStats.loading ? "..." : userStats.total.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <div className="p-2 bg-success/10 rounded-xl">
                    <UserCheck className="h-4 w-4 text-success" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userStats.loading ? "..." : userStats.active.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +180.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                  <div className="p-2 bg-warning/10 rounded-xl">
                    <UserX className="h-4 w-4 text-warning" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userStats.loading ? "..." : userStats.inactive.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +19% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
                  <div className="p-2 bg-purple-500/10 rounded-xl">
                    <Percent className="h-4 w-4 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userStats.loading ? "..." : `${userStats.activePercentage}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +2.4% from last month
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview />
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest system events and audit logs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivity />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>View detailed analytics and metrics across the system.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center border-dashed border-2 rounded-lg m-6 mt-0 border-border text-muted-foreground bg-muted/20">
                Detailed analytics visualization will appear here.
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/reports-advanced")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Advanced Reports</CardTitle>
                  <CardDescription>Generate multi-level analytics reports</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/applications")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Applications</CardTitle>
                  <CardDescription>Review student applications and status</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
