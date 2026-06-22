import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ROLES } from "@/constants/roles";
import { UI } from "@/constants/ui";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MessageCircle,
  User,
  Users,
  ListFilter,
  SquarePen,
  MessageSquareDot,
  Star,
  CircleUserRound,
  CircleOff,
  MessageSquareDashed,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { messagesApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import ChatRoomView from "@/components/chat/ChatRoomView";

interface LastMessagePreview {
  content: string;
  senderName: string;
  createdAt: string;
}

export function ChatTemplate() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activities, applications } = useActivity();

  const [search, setSearch] = useState("");
  const [previews, setPreviews] = useState<Record<string, LastMessagePreview>>({});

  useEffect(() => {
    messagesApi.getLastMessages().then(setPreviews).catch(() => {});
  }, []);

  const rolePrefix = user?.role === ROLES.ADMIN ? ROLES.ADMIN : user?.role === ROLES.COORDINATOR ? ROLES.COORDINATOR : ROLES.STUDENT;

  const chatRooms = useMemo(() => {
    if (!user) return [];
    let available = activities;
    if (user.role === ROLES.STUDENT) {
      const myActivityIds = applications
        .filter((a) => a.studentId === user.id && (a.status === "approved" || a.status === "pending"))
        .map((a) => a.activityId);
      available = activities.filter((a) => myActivityIds.includes(a.id));
    } else if (user.role === ROLES.COORDINATOR) {
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

  const selectedActivity = useMemo(
    () => activities.find((a) => a.id === activityId),
    [activities, activityId]
  );

  const handleSelectActivity = (id: string) => {
    navigate(`/${rolePrefix}/chat/${id}`);
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 h-full overflow-hidden">
      <ResizablePanel defaultSize={28} minSize={20} maxSize={42} className={`bg-background ${activityId ? 'max-md:hidden' : ''}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center px-4 py-3 border-b border-border/40 shrink-0">
            <h1 className="text-lg font-semibold">{UI.NAV.NOTIFICATIONS}</h1>
            <div className="flex items-center gap-0.5 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <SquarePen className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="h-4 w-4" /> {UI.CHAT.NEW_CONTACT}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Users className="h-4 w-4" /> {UI.CHAT.NEW_GROUP}
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
                  <DropdownMenuLabel>{UI.CHAT.FILTER_CHATS}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem><MessageSquareDot className="h-4 w-4" /> {UI.FILTER.UNREAD}</DropdownMenuItem>
                    <DropdownMenuItem><Star className="h-4 w-4" /> {UI.FILTER.FAVORITES}</DropdownMenuItem>
                    <DropdownMenuItem><CircleUserRound className="h-4 w-4" /> {UI.FILTER.CONTACTS}</DropdownMenuItem>
                    <DropdownMenuItem><CircleOff className="h-4 w-4" /> {UI.FILTER.NON_CONTACTS}</DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem><Users className="h-4 w-4" /> {UI.FILTER.GROUPS}</DropdownMenuItem>
                    <DropdownMenuItem><MessageSquareDashed className="h-4 w-4" /> {UI.FILTER.DRAFTS}</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="relative px-4 py-3 shrink-0">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input
              type="text"
              placeholder={UI.CHAT.SEARCH_CHATS}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-xl border border-input/80 bg-background/80 pl-9 pr-3 py-1 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-primary/60" />
                </div>
                <p className="text-sm font-medium text-foreground/70">{UI.CHAT.NO_CHATS}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {user?.role === ROLES.STUDENT
                    ? "Apply to an activity to start chatting"
                    : "Create an activity to get started"}
                </p>
              </div>
            ) : (
              chatRooms.map((activity) => {
                const preview = previews[activity.id];
                const isSelected = activity.id === activityId;
                return (
                  <button
                    key={activity.id}
                    onClick={() => handleSelectActivity(activity.id)}
                    className={`w-full px-4 py-3 transition-colors text-left border-b border-border/30 last:border-0 ${
                      isSelected
                        ? "bg-accent/60 hover:bg-accent/80"
                        : "hover:bg-accent/40"
                    }`}
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
                              {formatRelativeTime(preview.createdAt)}
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
        </div>
      </ResizablePanel>

      <ResizableHandle className={`bg-border/40 w-[3px] hover:bg-border/60 transition-colors ${activityId ? 'max-md:hidden' : ''}`} />

      <ResizablePanel defaultSize={72} className={`bg-background ${!activityId ? 'max-md:hidden' : ''}`}>
        {activityId && selectedActivity ? (
          <ChatRoomView activityId={activityId} activityTitle={selectedActivity.title} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-accent/10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center px-8"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-5">
                <MessageCircle className="w-8 h-8 text-primary/60" />
              </div>
              <h2 className="text-xl font-semibold text-foreground/80 mb-1.5">{UI.APP_LABEL} Chat</h2>
              <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto leading-relaxed">
                {UI.CHAT.SELECT_ACTIVITY}
              </p>
              <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/40">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {chatRooms.length} activit{chatRooms.length !== 1 ? "ies" : "y"} available
              </div>
            </motion.div>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
