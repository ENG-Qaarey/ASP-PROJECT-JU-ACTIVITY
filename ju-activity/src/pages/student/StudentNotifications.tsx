import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActivity } from "@/contexts/ActivityContext";
import { toast } from "@/hooks/use-toast";
import {
  Bell,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  Clock,
  PartyPopper,
  ThumbsDown,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LinesListSkeleton } from "@/components/ui/loading";

/* ─── Notification type config ─────────────────────────────────────────────── */
type NotifType = "approval" | "rejection" | "announcement" | "reminder" | "waitlist";

type NotifConfig = {
  icon: typeof Bell;
  color: string;
  bg: string;
  border: string;
  label: string;
  bannerBg: string;
  bannerText: string;
  bannerIcon: typeof Bell;
};

const notifConfig: Record<string, NotifConfig> = {
  approval: {
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-l-emerald-500",
    label: "Approved",
    bannerBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    bannerText: "text-emerald-700 dark:text-emerald-300",
    bannerIcon: PartyPopper,
  },
  rejection: {
    icon: XCircle,
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-l-red-500",
    label: "Rejected",
    bannerBg: "bg-red-500/10 dark:bg-red-500/15",
    bannerText: "text-red-700 dark:text-red-400",
    bannerIcon: ThumbsDown,
  },
  announcement: {
    icon: Info,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-l-primary",
    label: "Announcement",
    bannerBg: "bg-primary/5",
    bannerText: "text-primary",
    bannerIcon: Info,
  },
  reminder: {
    icon: AlertCircle,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-l-amber-500",
    label: "Reminder",
    bannerBg: "bg-amber-500/10",
    bannerText: "text-amber-700 dark:text-amber-300",
    bannerIcon: AlertCircle,
  },
  waitlist: {
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-l-orange-500",
    label: "Waitlisted",
    bannerBg: "bg-orange-500/10",
    bannerText: "text-orange-700 dark:text-orange-300",
    bannerIcon: Clock,
  },
};

/* ─── Filter tabs ───────────────────────────────────────────────────────────── */
type FilterTab = "all" | "approval" | "rejection" | "other";

const filterTabs: Array<{ id: FilterTab; label: string; icon: typeof Bell }> = [
  { id: "all", label: "All", icon: Bell },
  { id: "approval", label: "Approved", icon: CheckCircle },
  { id: "rejection", label: "Rejected", icon: XCircle },
  { id: "other", label: "Other", icon: Info },
];

/* ─── Component ─────────────────────────────────────────────────────────────── */
const StudentNotifications = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    isLoading,
  } = useActivity();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  /* ── Parsed + sorted list ──────────────────────────────────────────────── */
  const parsedNotifications = useMemo(
    () =>
      notifications
        .map((n: any) => ({
          ...n,
          createdAtDate: new Date(n.createdAt),
        }))
        .sort(
          (a: any, b: any) =>
            b.createdAtDate.getTime() - a.createdAtDate.getTime()
        ),
    [notifications]
  );

  /* ── Per-tab counts ────────────────────────────────────────────────────── */
  const counts = useMemo(
    () => ({
      all: parsedNotifications.length,
      approval: parsedNotifications.filter((n: any) => n.type === "approval").length,
      rejection: parsedNotifications.filter((n: any) => n.type === "rejection").length,
      other: parsedNotifications.filter(
        (n: any) => n.type !== "approval" && n.type !== "rejection"
      ).length,
    }),
    [parsedNotifications]
  );

  /* ── Filtered list ─────────────────────────────────────────────────────── */
  const filteredNotifications = useMemo(
    () =>
      parsedNotifications.filter((n: any) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "other")
          return n.type !== "approval" && n.type !== "rejection";
        return n.type === activeFilter;
      }),
    [parsedNotifications, activeFilter]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n: any) => !n.read).length,
    [notifications]
  );

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  const formatCreatedAt = (value: Date) => {
    if (Number.isNaN(value.getTime())) return "Unknown";
    return value.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatRelative = (date: Date) => {
    if (Number.isNaN(date.getTime())) return "Unknown";
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.round(diffH / 24)}d ago`;
  };

  /* ── Handlers ──────────────────────────────────────────────────────────── */
  const handleMarkOne = async (id: string) => {
    setMarkingId(id);
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      toast({
        title: "Action failed",
        description:
          error instanceof Error ? error.message : "Unable to update notification",
        variant: "destructive",
      });
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      toast({
        title: "All caught up",
        description: "All notifications marked as read.",
      });
    } catch (error) {
      toast({
        title: "Action failed",
        description:
          error instanceof Error ? error.message : "Unable to mark all notifications",
        variant: "destructive",
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your activity applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Bell className="w-4 h-4" />
                {unreadCount} unread
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAll}
              disabled={isMarkingAll || unreadCount === 0}
            >
              {isMarkingAll ? "Marking…" : "Mark all read"}
            </Button>
          </div>
        </div>

        {/* Quick-status summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total",
              value: counts.all,
              icon: Bell,
              color: "text-foreground",
              bg: "bg-muted/60",
            },
            {
              label: "Approved",
              value: counts.approval,
              icon: CheckCircle,
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Rejected",
              value: counts.rejection,
              icon: XCircle,
              color: "text-red-500 dark:text-red-400",
              bg: "bg-red-500/10",
            },
            {
              label: "Unread",
              value: unreadCount,
              icon: AlertCircle,
              color: "text-primary",
              bg: "bg-primary/10",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className={`${stat.bg} border-transparent`}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${stat.color} flex-shrink-0`} />
                  <div>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                id={`notif-filter-${tab.id}`}
                size="sm"
                variant={activeFilter === tab.id ? "default" : "outline"}
                onClick={() => setActiveFilter(tab.id)}
                className="gap-1.5"
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span
                  className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeFilter === tab.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {counts[tab.id]}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Notification list */}
        <div className="space-y-3">
          {isLoading && parsedNotifications.length === 0 ? (
            <LinesListSkeleton count={6} />
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification: any, index: number) => {
                const cfg =
                  notifConfig[notification.type] ?? notifConfig.announcement;
                const MainIcon = cfg.icon;
                const BannerIcon = cfg.bannerIcon;
                const isApproval = notification.type === "approval";
                const isRejection = notification.type === "rejection";
                const isActionable = isApproval || isRejection;

                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`transition-all hover:shadow-md border-l-4 ${cfg.border} ${
                        !notification.read ? "shadow-sm" : "opacity-80"
                      } ${
                        isApproval && !notification.read
                          ? "ring-1 ring-emerald-500/20"
                          : ""
                      } ${
                        isRejection && !notification.read
                          ? "ring-1 ring-red-500/20"
                          : ""
                      }`}
                      onClick={() =>
                        !notification.read
                          ? handleMarkOne(notification.id)
                          : undefined
                      }
                      style={{ cursor: !notification.read ? "pointer" : "default" }}
                    >
                      <CardContent className="p-0">

                        {/* ── Status banner for approval / rejection ── */}
                        {isActionable && (
                          <div
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[inherit] ${cfg.bannerBg}`}
                          >
                            <BannerIcon
                              className={`w-4 h-4 ${cfg.bannerText} flex-shrink-0`}
                            />
                            <span
                              className={`text-sm font-semibold ${cfg.bannerText}`}
                            >
                              {isApproval
                                ? "🎉 Your application was Approved!"
                                : "❌ Your application was Rejected"}
                            </span>
                            {!notification.read && (
                              <span className="ml-auto w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                        )}

                        {/* ── Main card body ── */}
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon bubble */}
                            <div
                              className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}
                            >
                              <MainIcon className={`w-5 h-5 ${cfg.color}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-foreground">
                                    {notification.title}
                                  </h3>
                                  <Badge
                                    variant={
                                      isApproval
                                        ? "default"
                                        : isRejection
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className={`capitalize text-xs ${
                                      isApproval
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                        : ""
                                    }`}
                                  >
                                    {cfg.label}
                                  </Badge>
                                  {!notification.read && (
                                    <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                                      New
                                    </Badge>
                                  )}
                                </div>

                                {/* Time */}
                                <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                                  <Clock className="w-3 h-3" />
                                  {formatRelative(notification.createdAtDate)}
                                </span>
                              </div>

                              {/* Message */}
                              <p
                                className={`text-sm mt-1 ${
                                  isApproval
                                    ? "text-emerald-700 dark:text-emerald-300 font-medium"
                                    : isRejection
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {notification.message}
                              </p>

                              {/* Date + hint */}
                              <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatCreatedAt(notification.createdAtDate)}
                                </span>
                                {!notification.read && (
                                  <span className="text-xs text-muted-foreground italic">
                                    {markingId === notification.id
                                      ? "Marking as read…"
                                      : "Tap to mark as read"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Unread dot (non-actionable) */}
                            {!notification.read && !isActionable && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Empty state */}
        {!isLoading && filteredNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-14"
          >
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">
              {activeFilter === "all"
                ? "No notifications yet"
                : `No ${activeFilter} notifications`}
            </h3>
            <p className="text-muted-foreground mt-1">
              {activeFilter === "all"
                ? "You're all caught up! Check back later for updates."
                : "Switch to a different filter to see more."}
            </p>
            {activeFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setActiveFilter("all")}
              >
                View all notifications
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentNotifications;
