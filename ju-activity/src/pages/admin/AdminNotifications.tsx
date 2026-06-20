import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useActivity } from "@/contexts/ActivityContext";
import { toast } from "@/hooks/use-toast";
import type { Notification } from "@/types/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Info,
  Search,
  MailCheck,
  Filter,
  Inbox,
  Clock,
  ClipboardList,
  CheckCircle,
  XCircle,
  UserCheck,
} from "lucide-react";

/* ─── Notification type metadata ──────────────────────────────────────────── */
const notificationMeta: Record<
  Notification["type"],
  { label: string; icon: typeof Bell; accent: string; chip: string }
> = {
  approval: {
    label: "Approval",
    icon: CheckCircle2,
    accent: "text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  rejection: {
    label: "Rejection",
    icon: AlertTriangle,
    accent: "text-destructive",
    chip: "bg-destructive/10 text-destructive",
  },
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    accent: "text-primary",
    chip: "bg-primary/10 text-primary",
  },
  reminder: {
    label: "Reminder",
    icon: Info,
    accent: "text-blue-600 dark:text-blue-400",
    chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200",
  },
  waitlist: {
    label: "Waitlist",
    icon: Clock,
    accent: "text-orange-500 dark:text-orange-400",
    chip: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300",
  },
};

const typeFilters: Array<"all" | Notification["type"]> = [
  "all",
  "approval",
  "rejection",
  "announcement",
  "reminder",
  "waitlist",
];
const statusFilters = ["all", "unread", "read"] as const;
type StatusFilter = (typeof statusFilters)[number];

/* ─── Component ────────────────────────────────────────────────────────────── */
const AdminNotifications = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    applications,
    updateApplication,
  } = useActivity();

  /* — Active section toggle — */
  const [activeSection, setActiveSection] = useState<"applications" | "notifications">(
    "applications"
  );

  /* — Notification feed state — */
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof typeFilters)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  /* — Application activity state — */
  const [appSearchTerm, setAppSearchTerm] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "waitlisted"
  >("all");
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  /* ── Notification computations ─────────────────────────────────────────── */
  const parsedNotifications = useMemo(
    () =>
      notifications
        .map((n) => ({ ...n, createdAtDate: new Date(n.createdAt) }))
        .sort((a, b) => b.createdAtDate.getTime() - a.createdAtDate.getTime()),
    [notifications]
  );

  const filteredNotifications = useMemo(
    () =>
      parsedNotifications.filter((n) => {
        const matchesType = typeFilter === "all" || n.type === typeFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "unread" && !n.read) ||
          (statusFilter === "read" && n.read);
        const matchesSearch =
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesStatus && matchesSearch;
      }),
    [parsedNotifications, typeFilter, statusFilter, searchTerm]
  );

  const stats = useMemo(() => {
    const unread = notifications.filter((n) => !n.read).length;
    const breakdown = typeFilters.reduce(
      (acc, type) => {
        if (type === "all") return acc;
        acc[type] = notifications.filter((n) => n.type === type).length;
        return acc;
      },
      {} as Record<Notification["type"], number>
    );
    return {
      total: notifications.length,
      unread,
      read: notifications.length - unread,
      breakdown,
      latestUpdate: parsedNotifications[0]?.createdAtDate,
    };
  }, [notifications, parsedNotifications]);

  /* ── Application computations ──────────────────────────────────────────── */
  const appStats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    }),
    [applications]
  );

  const filteredApps = useMemo(
    () =>
      [...applications]
        .sort(
          (a, b) =>
            new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        )
        .filter((app) => {
          const matchesSearch =
            app.studentName.toLowerCase().includes(appSearchTerm.toLowerCase()) ||
            app.activityTitle.toLowerCase().includes(appSearchTerm.toLowerCase());
          const matchesStatus =
            appStatusFilter === "all" || app.status === appStatusFilter;
          return matchesSearch && matchesStatus;
        }),
    [applications, appSearchTerm, appStatusFilter]
  );

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  const formatDateTime = (date: Date) => {
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return `${date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} • ${date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  };

  const formatRelative = (date: Date) => {
    if (Number.isNaN(date.getTime())) return "Unknown";
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.round(diffHours / 24)}d ago`;
  };

  /* ── Handlers ──────────────────────────────────────────────────────────── */
  const handleMarkNotification = async (id: string) => {
    setMarkingNotificationId(id);
    try {
      await markNotificationAsRead(id);
      toast({ title: "Notification updated", description: "Marked as read." });
    } catch (error) {
      toast({
        title: "Action failed",
        description:
          error instanceof Error ? error.message : "Unable to update notification",
        variant: "destructive",
      });
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const handleMarkAll = async () => {
    if (!stats.unread) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      toast({
        title: "All caught up",
        description: "Every notification is now marked as read.",
      });
    } catch (error) {
      toast({
        title: "Action failed",
        description:
          error instanceof Error ? error.message : "Unable to mark notifications",
        variant: "destructive",
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleApplicationUpdate = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    setIsUpdatingId(id);
    try {
      await updateApplication(id, { status });
      toast({
        title: status === "approved" ? "Application Approved ✅" : "Application Rejected",
        description: "The student has been notified.",
        variant: status === "approved" ? "default" : "destructive",
      });
    } catch (e: any) {
      toast({
        title: "Update Failed",
        description: e?.message || "Could not update application",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase text-muted-foreground tracking-wide">
              Admin inbox
            </p>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              Notifications Hub
              {stats.unread > 0 && (
                <span className="text-sm font-medium text-primary/80 bg-primary/10 px-3 py-1 rounded-full">
                  {stats.unread} unread
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">
              Track student applications, approvals, and system alerts in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
            <Button
              variant="outline"
              onClick={handleMarkAll}
              disabled={isMarkingAll || stats.unread === 0}
              className="flex-1 sm:flex-none"
            >
              {isMarkingAll ? "Marking..." : "Mark all read"}
            </Button>
            <Button variant="secondary" className="gap-2 flex-1 sm:flex-none">
              <MailCheck className="w-4 h-4" />
              Export log
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-primary-foreground/80">
                Inbox health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-bold">{stats.total || 0}</p>
              <p className="text-primary-foreground/80 text-sm">
                Total notifications tracked
              </p>
              <Progress
                value={stats.total ? (stats.read / stats.total) * 100 : 0}
                className="bg-primary-foreground/20"
              />
              <div className="text-xs flex justify-between text-primary-foreground/80">
                <span>{stats.read} read</span>
                <span>{stats.unread} unread</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Application pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-semibold">{appStats.pending}</p>
              <p className="text-muted-foreground text-sm">Pending review</p>
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                <div className="text-center p-1.5 bg-emerald-500/10 rounded-lg">
                  <p className="font-bold text-emerald-600">{appStats.approved}</p>
                  <p className="text-muted-foreground">Approved</p>
                </div>
                <div className="text-center p-1.5 bg-amber-500/10 rounded-lg">
                  <p className="font-bold text-amber-600">{appStats.pending}</p>
                  <p className="text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-1.5 bg-destructive/10 rounded-lg">
                  <p className="font-bold text-destructive">{appStats.rejected}</p>
                  <p className="text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Latest activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.latestUpdate ? (
                <>
                  <p className="text-xl font-semibold">
                    {formatRelative(stats.latestUpdate)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last update {formatDateTime(stats.latestUpdate)}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No notifications yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section switcher */}
        <div className="flex gap-2 flex-wrap">
          <Button
            id="btn-application-activity"
            variant={activeSection === "applications" ? "default" : "outline"}
            onClick={() => setActiveSection("applications")}
            className="flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            Application Activity
            {appStats.pending > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                {appStats.pending} pending
              </span>
            )}
          </Button>
          <Button
            id="btn-notification-feed"
            variant={activeSection === "notifications" ? "default" : "outline"}
            onClick={() => setActiveSection("notifications")}
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Notification Feed
            {stats.unread > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full font-semibold">
                {stats.unread}
              </span>
            )}
          </Button>
        </div>

        {/* ═══ APPLICATION ACTIVITY SECTION ═══════════════════════════════════ */}
        {activeSection === "applications" && (
          <motion.div
            key="applications-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="overflow-hidden">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    Student Application Activity
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {filteredApps.length} of {appStats.total} applications
                  </p>
                </div>

                {/* Search + filter bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="app-search"
                      placeholder="Search by student name or activity…"
                      value={appSearchTerm}
                      onChange={(e) => setAppSearchTerm(e.target.value)}
                      className="pl-9 w-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "pending", "approved", "rejected"] as const).map(
                      (status) => (
                        <Button
                          key={status}
                          id={`app-filter-${status}`}
                          size="sm"
                          variant={appStatusFilter === status ? "default" : "outline"}
                          onClick={() => setAppStatusFilter(status)}
                          className="capitalize"
                        >
                          {status}
                        </Button>
                      )
                    )}
                    {(appSearchTerm || appStatusFilter !== "all") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAppSearchTerm("");
                          setAppStatusFilter("all");
                        }}
                      >
                        <Filter className="w-3.5 h-3.5 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <Separator />

              {filteredApps.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-3">
                  <Inbox className="w-10 h-10 mx-auto" />
                  <p className="font-semibold">No applications match the filter</p>
                  <p className="text-sm">Try adjusting the search or status filter.</p>
                </div>
              ) : (
                <ScrollArea className="h-[540px]">
                  <div className="p-4 space-y-3">
                    {filteredApps.map((app, index) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, translateY: 8 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: index * 0.025 }}
                      >
                        <div
                          className={`rounded-2xl border p-4 transition-colors ${
                            app.status === "pending"
                              ? "border-amber-400/50 bg-amber-500/5 dark:bg-amber-500/5"
                              : app.status === "approved"
                              ? "border-emerald-400/30 bg-emerald-500/5 dark:bg-emerald-500/5"
                              : app.status === "rejected"
                              ? "border-destructive/30 bg-destructive/5"
                              : "bg-card"
                          }`}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            {/* Left: avatar + info */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <Avatar className="h-12 w-12 border-2 border-border/60 flex-shrink-0">
                                {app.studentAvatar || app.student?.avatar ? (
                                  <AvatarImage
                                    src={
                                      (app.studentAvatar || app.student?.avatar) ?? ""
                                    }
                                    alt={app.studentName}
                                  />
                                ) : null}
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                  {(app.studentName || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0">
                                {/* Student name + status badge */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-base text-foreground truncate">
                                    {app.studentName}
                                  </span>
                                  <Badge
                                    variant={
                                      app.status === "approved"
                                        ? "default"
                                        : app.status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="capitalize text-xs"
                                  >
                                    {app.status}
                                  </Badge>
                                </div>

                                {/* Activity name */}
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  Applied for{" "}
                                  <span className="font-semibold text-primary">
                                    {app.activityTitle}
                                  </span>
                                </p>

                                {/* Email / department */}
                                {(app.studentEmail || app.studentDepartment) && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {[app.studentEmail, app.studentDepartment]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                )}

                                {/* Date */}
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Submitted: {app.appliedAt}
                                </p>
                              </div>
                            </div>

                            {/* Right: action buttons (only for pending) */}
                            {app.status === "pending" && (
                              <div className="flex gap-2 flex-shrink-0">
                                <Button
                                  id={`approve-${app.id}`}
                                  size="sm"
                                  variant="outline"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800 font-semibold"
                                  onClick={() =>
                                    handleApplicationUpdate(app.id, "approved")
                                  }
                                  disabled={isUpdatingId === app.id}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                  {isUpdatingId === app.id ? "Saving…" : "Approve"}
                                </Button>
                                <Button
                                  id={`reject-${app.id}`}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-800 font-semibold"
                                  onClick={() =>
                                    handleApplicationUpdate(app.id, "rejected")
                                  }
                                  disabled={isUpdatingId === app.id}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                  {isUpdatingId === app.id ? "Saving…" : "Reject"}
                                </Button>
                              </div>
                            )}

                            {/* Resolved status icon */}
                            {app.status === "approved" && (
                              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 hidden sm:block" />
                            )}
                            {app.status === "rejected" && (
                              <XCircle className="w-5 h-5 text-destructive flex-shrink-0 hidden sm:block" />
                            )}
                          </div>

                          {/* Notes if present */}
                          {app.notes && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  Notes:{" "}
                                </span>
                                {app.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </Card>
          </motion.div>
        )}

        {/* ═══ NOTIFICATION FEED SECTION ═══════════════════════════════════════ */}
        {activeSection === "notifications" && (
          <motion.div
            key="notifications-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"
          >
            <Card className="overflow-hidden">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications feed
                  </CardTitle>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search title or message"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="gap-2 w-full sm:w-auto"
                      onClick={() => {
                        setTypeFilter("all");
                        setStatusFilter("all");
                        setSearchTerm("");
                      }}
                    >
                      <Filter className="w-4 h-4" />
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {typeFilters.map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant={typeFilter === type ? "default" : "outline"}
                      onClick={() => setTypeFilter(type)}
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {statusFilters.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={statusFilter === status ? "default" : "ghost"}
                      onClick={() => setStatusFilter(status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </CardHeader>

              <Separator />

              {filteredNotifications.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-3">
                  <Inbox className="w-10 h-10 mx-auto" />
                  <p className="font-semibold">
                    No notifications match the current filters
                  </p>
                  <p className="text-sm">
                    Try adjusting the filter set or clearing the search.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[480px] md:h-[600px]">
                  <div className="p-6 space-y-4">
                    {filteredNotifications.map((notification, index) => {
                      const meta = notificationMeta[notification.type];
                      const Icon = meta.icon;
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, translateY: 8 }}
                          animate={{ opacity: 1, translateY: 0 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          <div
                            className={`rounded-2xl border p-5 transition ${
                              notification.read
                                ? "bg-card"
                                : "border-primary/40 bg-primary/5"
                            }`}
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div className="flex gap-4 flex-1 flex-wrap sm:flex-nowrap">
                                <div
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${meta.chip}`}
                                >
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={`text-xs ${meta.chip}`}>
                                      {meta.label}
                                    </Badge>
                                    {!notification.read && (
                                      <Badge variant="secondary">Unread</Badge>
                                    )}
                                  </div>
                                  <h3 className="mt-2 text-lg font-semibold text-foreground">
                                    {notification.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {notification.message}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-start md:items-end gap-2 text-left md:text-right w-full md:w-auto">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatRelative(notification.createdAtDate)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(notification.createdAtDate)}
                                </span>
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 w-full md:w-auto"
                                    onClick={() =>
                                      handleMarkNotification(notification.id)
                                    }
                                    disabled={
                                      markingNotificationId === notification.id
                                    }
                                  >
                                    {markingNotificationId === notification.id
                                      ? "Updating..."
                                      : "Mark read"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </Card>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Category mix
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(stats.breakdown).map(([type, count]) => {
                    const meta = notificationMeta[type as Notification["type"]];
                    const Icon = meta.icon;
                    const percentage = stats.total
                      ? Math.round((count / stats.total) * 100)
                      : 0;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${meta.accent}`} />
                            {meta.label}
                          </span>
                          <span className="text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="mt-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Playbook</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="font-semibold text-foreground">Quick triage tips</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Approve or escalate unread applications first.</li>
                      <li>
                        Announcements can be archived after confirming visibility.
                      </li>
                      <li>Reminders signal upcoming attendance or deadlines.</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="font-semibold text-foreground">Best practices</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Batch mark read after completing related tasks.</li>
                      <li>Use filters to focus on urgent categories.</li>
                      <li>Download logs weekly for compliance reviews.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminNotifications;
