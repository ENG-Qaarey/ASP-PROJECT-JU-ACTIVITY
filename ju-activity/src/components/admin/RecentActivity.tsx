import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auditLogsApi } from "@/lib/api";
import { AuditLog } from "@/types/api";
import { toast } from "@/hooks/use-toast";

export function RecentActivity() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchRecentLogs = async () => {
      try {
        const response = await auditLogsApi.getAll({ take: 5 });
        if (active) {
          setLogs(response && Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Failed to fetch recent audit logs:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchRecentLogs();
    return () => {
      active = false;
    };
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 60) return "Just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "";
    }
  };

  const toTitle = (value: string) => {
    if (!value) return "Unknown Action";
    return value
      .toLowerCase()
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  };

  const getInitials = (log: AuditLog) => {
    const name = log.actorEmail || log.targetEmail || "System";
    if (name === "System") return "SY";
    const parts = name.split("@")[0].split(/[._-]/);
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 animate-pulse">
            <div className="rounded-full bg-slate-200 h-9 w-9" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-2 bg-slate-200 rounded w-1/3" />
              <div className="h-2 bg-slate-200 rounded w-1/2" />
            </div>
            <div className="h-2 bg-slate-200 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-6">
        No recent activities recorded.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {logs.map((log) => {
        const actorName = log.actorEmail ?? log.targetEmail ?? "System";
        const actionText = toTitle(log.action);
        const detailText = log.details || "";

        return (
          <div key={log.id} className="flex items-start">
            <Avatar className="h-9 w-9 mt-0.5">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {getInitials(log)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1 flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none text-foreground truncate">
                {actorName}
              </p>
              <p className="text-xs text-muted-foreground">
                {actionText} {detailText && ` - ${detailText}`}
              </p>
            </div>
            <div className="ml-auto font-medium text-xs text-muted-foreground whitespace-nowrap pl-2">
              {formatTimeAgo(log.createdAt)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
