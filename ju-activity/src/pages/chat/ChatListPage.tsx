import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { messagesApi } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Search,
  SquarePen,
  ListFilter,
  MessageSquareDot,
  Star,
  CircleUserRound,
  CircleOff,
  Users,
  MessageSquareDashed,
  MessageCircle,
  User,
  ChevronDown,
  Clock,
} from "lucide-react";

const ChatListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activities, applications } = useActivity();
  const [search, setSearch] = useState("");
  const [previews, setPreviews] = useState<Record<string, { content: string; senderName: string; createdAt: string }>>({});

  useEffect(() => {
    messagesApi.getLastMessages().then(setPreviews).catch(() => {});
  }, []);

  const appCountByActivity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const app of applications) {
      map[app.activityId] = (map[app.activityId] || 0) + 1;
    }
    return map;
  }, [applications]);

  const chatRooms = useMemo(() => {
    if (!user) return [];
    let available = activities;
    if (user.role === "student") {
      const myActivityIds = applications
        .filter((a) => a.studentId === user.id && (a.status === "approved" || a.status === "pending"))
        .map((a) => a.activityId);
      available = activities.filter((a) => myActivityIds.includes(a.id));
    } else if (user.role === "coordinator") {
      available = activities.filter((a) =>
        String(a.coordinatorId).toLowerCase() === String(user.id).toLowerCase()
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      available = available.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.coordinatorName?.toLowerCase().includes(q)
      );
    }
    return available.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [user, activities, applications, search]);

  const rolePrefix = user?.role === "admin" ? "admin" : user?.role === "coordinator" ? "coordinator" : "student";

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Panel - Contact List (template style) */}
        <div className="w-full max-w-md border-r border-border/60 bg-card/40 backdrop-blur-sm flex flex-col">
          {/* Header */}
          <div className="flex items-center px-4 py-3 border-b border-border/40">
            <h1 className="text-lg font-semibold">Chats</h1>
            <div className="flex items-center gap-0.5 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <SquarePen className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="h-4 w-4" /> New Contact
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Users className="h-4 w-4" /> New Group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <ListFilter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter Chats By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem><MessageSquareDot className="h-4 w-4" /> Unread</DropdownMenuItem>
                    <DropdownMenuItem><Star className="h-4 w-4" /> Favorites</DropdownMenuItem>
                    <DropdownMenuItem><CircleUserRound className="h-4 w-4" /> Contacts</DropdownMenuItem>
                    <DropdownMenuItem><CircleOff className="h-4 w-4" /> Non Contacts</DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem><Users className="h-4 w-4" /> Groups</DropdownMenuItem>
                    <DropdownMenuItem><MessageSquareDashed className="h-4 w-4" /> Drafts</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative px-4 py-3">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-xl border border-input/80 bg-background/80 backdrop-blur-sm pl-9 pr-3 py-1 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary/50"
            />
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {chatRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-primary/60" />
                </div>
                <p className="text-sm font-medium text-foreground/70">No chats yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {user?.role === "student"
                    ? "Apply to an activity to start chatting"
                    : "Create an activity to get started"}
                </p>
              </div>
            ) : (
              chatRooms.map((activity) => {
                const preview = previews[activity.id];
                return (
                  <button
                    key={activity.id}
                    onClick={() => navigate(`/${rolePrefix}/chat/${activity.id}`)}
                    className="w-full px-4 py-3 hover:bg-accent/50 transition-colors text-left border-b border-border/30 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 shrink-0 ring-1 ring-border shadow-sm">
                        <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                          {(activity.title || "A").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold truncate">{activity.title}</h3>
                          {preview && (
                            <span className="text-[11px] text-muted-foreground/50 shrink-0">
                              {formatTime(preview.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                          {preview ? (
                            <>{preview.senderName}: {preview.content}</>
                          ) : (
                            <span className="italic">No messages yet</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom bar with count */}
          <div className="border-t border-border/40 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground/50">
            <span>{chatRooms.length} chat{chatRooms.length !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Updated just now</span>
          </div>
        </div>

        {/* Right Panel - Empty state (template style) */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-background via-background to-accent/10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center px-8"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-5">
              <MessageCircle className="w-8 h-8 text-primary/60" />
            </div>
            <h2 className="text-xl font-semibold text-foreground/80 mb-1.5">JU Activity Hub Chat</h2>
            <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto leading-relaxed">
              Select an activity from the left to start chatting with coordinators and participants.
            </p>
            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/40">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {chatRooms.length} activit{chatRooms.length !== 1 ? "ies" : "y"} available
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatListPage;
