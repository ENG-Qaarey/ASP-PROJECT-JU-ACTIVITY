import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MessageCircle, Send, SmilePlus, Paperclip, CheckCheck, X,
} from "lucide-react";
import { UserRole } from "@/contexts/AuthContext";
import { formatDateLabel, formatRelativeTime } from "@/lib/format";

interface ChatMessage {
  id: string;
  sender: "admin" | "user";
  content: string;
  timestamp: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

interface CommunicationsHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  users: UserProfile[];
  currentUserId?: string;
  isDarkMode: boolean;
}

const emojiPalette = ["👋", "😊", "🔥", "✅", "🎉", "👍", "🤝", "💡"] as const;

export default function CommunicationsHub({
  open, onOpenChange, isAdmin, users, currentUserId, isDarkMode,
}: CommunicationsHubProps) {
  const [chatSearch, setChatSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});
  const replyTimers = useRef<Record<string, number>>({});
  const [typingUserId, setTypingUserId] = useState<string | null>(null);

  const chatDirectory = useMemo(() => {
    if (isAdmin) {
      const filtered = users?.filter((profile) => profile.id !== currentUserId) ?? [];
      if (filtered.length > 0) return filtered;
      return [
        { id: "demo-student-1", name: "Celine Cruz", email: "celine.cruz@ju.edu", role: "student" as UserRole, department: "Engineering" },
        { id: "demo-coord-1", name: "Coach Ramos", email: "coach.ramos@ju.edu", role: "coordinator" as UserRole, department: "Sports Affairs" },
        { id: "demo-admin-2", name: "Dean Alvarez", email: "dalvarez@ju.edu", role: "admin" as UserRole, department: "Academic Council" },
      ];
    }
    return [
      { id: "admin-support", name: "Admin Support", email: "support@ju.edu", role: "admin" as UserRole, department: "JU-AMS" },
    ];
  }, [isAdmin, users, currentUserId]);

  const filteredDirectory = useMemo(() => {
    const query = chatSearch.trim().toLowerCase();
    if (!query) return chatDirectory;
    return chatDirectory.filter((profile) =>
      profile.name?.toLowerCase().includes(query) ||
      profile.email?.toLowerCase().includes(query) ||
      profile.role?.toLowerCase().includes(query)
    );
  }, [chatDirectory, chatSearch]);

  const selectedUser = selectedUserId ? chatDirectory.find((p) => p.id === selectedUserId) : null;
  const selectedMessages = selectedUserId ? chatHistory[selectedUserId] ?? [] : [];

  const chatSummaries = useMemo(() => {
    const summaries: Record<string, { preview: string; timestamp: string; sender: ChatMessage["sender"] }> = {};
    chatDirectory.forEach((profile) => {
      const history = chatHistory[profile.id];
      if (history?.length) {
        const last = history[history.length - 1];
        summaries[profile.id] = { preview: last.content, timestamp: last.timestamp, sender: last.sender };
      }
    });
    return summaries;
  }, [chatDirectory, chatHistory]);

  const activeChats = useMemo(() =>
    chatDirectory
      .filter((p) => Boolean(chatSummaries[p.id]))
      .sort((a, b) => new Date(chatSummaries[b.id]?.timestamp || 0).getTime() - new Date(chatSummaries[a.id]?.timestamp || 0).getTime()),
  [chatDirectory, chatSummaries]);

  const canSendMessage = Boolean(selectedUserId && draftMessage.trim());

  useEffect(() => {
    if (open && !selectedUserId && chatDirectory.length > 0) {
      setSelectedUserId(chatDirectory[0].id);
    }
  }, [open, chatDirectory, selectedUserId]);

  useEffect(() => {
    if (!open) setTypingUserId(null);
  }, [open]);

  useEffect(() => {
    return () => {
      Object.values(replyTimers.current).forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const appendMessage = (targetUserId: string, message: ChatMessage) => {
    setChatHistory((prev) => ({
      ...prev,
      [targetUserId]: [...(prev[targetUserId] ?? []), message],
    }));
  };

  const queueMockReply = (targetUserId: string) => {
    const profile = chatDirectory.find((e) => e.id === targetUserId);
    if (!profile) return;
    if (replyTimers.current[targetUserId]) window.clearTimeout(replyTimers.current[targetUserId]);
    setTypingUserId(targetUserId);
    const delay = 1200 + Math.random() * 2000;
    replyTimers.current[targetUserId] = window.setTimeout(() => {
      appendMessage(targetUserId, {
        id: `${targetUserId}-reply-${Date.now()}`,
        sender: "user",
        content: "Thanks for the message!",
        timestamp: new Date().toISOString(),
      });
      setTypingUserId((cur) => (cur === targetUserId ? null : cur));
      delete replyTimers.current[targetUserId];
    }, delay);
  };

  const handleSendMessage = () => {
    if (!selectedUserId || !draftMessage.trim()) return;
    appendMessage(selectedUserId, {
      id: `${selectedUserId}-${Date.now()}`,
      sender: "admin",
      content: draftMessage.trim(),
      timestamp: new Date().toISOString(),
    });
    setDraftMessage("");
    queueMockReply(selectedUserId);
  };

  const insertEmoji = (emoji: string) => setDraftMessage((prev) => `${prev}${emoji}`);

  const dirClass = isDarkMode
    ? "border-slate-800 bg-slate-950/80 text-slate-100 shadow-[0_25px_60px_rgba(2,6,23,0.65)]"
    : "border-slate-200 bg-white/95 text-slate-900 shadow-[0_25px_45px_rgba(15,23,42,0.08)]";

  const convClass = isDarkMode
    ? "border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 shadow-[0_35px_70px_rgba(2,6,23,0.75)]"
    : "border-slate-200 bg-gradient-to-b from-white to-slate-50 text-slate-900 shadow-[0_35px_70px_rgba(15,23,42,0.12)]";

  const directoryPanel = (
    <div className={`flex h-full min-h-[320px] flex-col rounded-3xl border p-4 transition-all duration-300 ${dirClass}`}>
      {activeChats.length > 0 && (
        <div className="mb-2">
          <div className={`flex items-center justify-between text-[11px] uppercase tracking-[0.2em] ${isDarkMode ? "text-slate-500" : "text-muted-foreground"}`}>
            <span>Hot threads</span>
            <span className={isDarkMode ? "text-slate-200" : "text-foreground"}>{activeChats.length}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeChats.slice(0, 4).map((profile) => (
              <Badge key={profile.id} variant={selectedUserId === profile.id ? "default" : "secondary"}
                className="cursor-pointer rounded-2xl" onClick={() => setSelectedUserId(profile.id)}>
                {profile.name || "Unnamed"}
              </Badge>
            ))}
          </div>
        </div>
      )}
      <Input placeholder="Search by name, email, or role" value={chatSearch}
        onChange={(e) => setChatSearch(e.target.value)}
        className={`text-sm transition-colors ${isDarkMode ? "border-slate-800 bg-slate-900/70 text-slate-100 placeholder:text-slate-500" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500"}`} />
      <ScrollArea className="mt-4 flex-1 min-h-0 pr-1">
        <div className="space-y-2 pb-2">
          {filteredDirectory.length === 0 ? (
            <p className={`py-6 text-center text-sm ${isDarkMode ? "text-slate-500" : "text-muted-foreground"}`}>No matches found.</p>
          ) : (
            filteredDirectory.map((profile) => {
              const isActive = selectedUserId === profile.id;
              return (
                <button key={profile.id} onClick={() => setSelectedUserId(profile.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition-all ${
                    isActive
                      ? isDarkMode ? "border-sky-500/70 bg-sky-500/15 shadow-lg" : "border-primary bg-primary/5 shadow-sm"
                      : isDarkMode ? "border-slate-900 bg-slate-950/60 hover:border-slate-700" : "border-transparent bg-slate-50 hover:border-slate-200"
                  }`}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shadow-inner">
                      <AvatarFallback className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-primary/10 text-primary"}>
                        {profile.name?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDarkMode ? "text-slate-50" : "text-foreground"}`}>
                        {profile.name || "Unnamed User"}
                      </p>
                      <p className={`text-xs truncate capitalize ${isDarkMode ? "text-slate-400" : "text-muted-foreground"}`}>
                        {profile.role}
                      </p>
                    </div>
                    <span className={`text-xs ${isDarkMode ? "text-slate-500" : "text-muted-foreground"}`}>
                      {(chatHistory[profile.id]?.length || 0).toString()} msg
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const conversationPanel = (
    <div className={`flex h-full min-h-[320px] flex-col rounded-3xl border p-4 transition-all duration-300 ${convClass}`}>
      {selectedUser ? (
        <>
          <div className={`mb-3 flex items-center gap-3 rounded-2xl px-4 py-3 ${isDarkMode ? "bg-slate-800/80" : "bg-white"}`}>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">{selectedUser.name?.charAt(0) ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold truncate">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
            <Badge variant="secondary" className={`capitalize ${isDarkMode ? "bg-slate-700 text-slate-100" : ""}`}>
              {selectedUser.role}
            </Badge>
          </div>
          <ScrollArea className="flex-1 min-h-0 pr-2">
            <div className="space-y-3 pb-2">
              {selectedMessages.length === 0 ? null : (
                selectedMessages.map((message, index) => {
                  const currentLabel = formatDateLabel(message.timestamp);
                  const previousLabel = index > 0 ? formatDateLabel(selectedMessages[index - 1].timestamp) : null;
                  const showDateChip = currentLabel !== previousLabel;
                  const isAdminMessage = message.sender === "admin";
                  const outgoingBubble = isDarkMode
                    ? "rounded-br-md bg-gradient-to-r from-sky-500/90 via-sky-500 to-sky-400/90 text-white"
                    : "rounded-br-md bg-gradient-to-r from-sky-500 to-sky-600 text-white";
                  const incomingBubble = isDarkMode
                    ? "rounded-bl-md border border-slate-800 bg-slate-900 text-slate-100"
                    : "rounded-bl-md border border-slate-100 bg-white text-slate-900";
                  const bubbleClass = `max-w-[78%] rounded-3xl px-4 py-2 text-sm shadow ${isAdminMessage ? outgoingBubble : incomingBubble}`;
                  const timestampClass = isAdminMessage ? "justify-end text-white/80" : isDarkMode ? "text-slate-400" : "text-muted-foreground";
                  return (
                    <div key={message.id} className="space-y-2">
                      {showDateChip && (
                        <div className="text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground/80">
                          {currentLabel}
                        </div>
                      )}
                      <div className={`flex ${isAdminMessage ? "justify-end" : "justify-start"}`}>
                        <div className={bubbleClass}>
                          <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                          <div className={`mt-1 flex items-center gap-1 text-[11px] ${timestampClass}`}>
                            <span>{formatRelativeTime(message.timestamp)}</span>
                            {isAdminMessage && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {typingUserId === selectedUser.id && (
                <div className="flex justify-start" aria-live="polite">
                  <div className={`inline-flex items-center gap-1 rounded-2xl px-4 py-2 text-[11px] ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-muted text-muted-foreground"}`}>
                    <span className="h-2 w-2 rounded-full bg-current/70 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-current/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-current/50 animate-bounce [animation-delay:300ms]" />
                    <span>typing…</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className={`mt-4 flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm ${isDarkMode ? "border-slate-800 bg-slate-950/90 text-slate-100" : "border-slate-200 bg-white text-slate-600"}`}>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon"
                  className={isDarkMode ? "text-slate-300 hover:text-white" : "text-muted-foreground hover:text-primary"}>
                  <SmilePlus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start"
                className={`w-52 rounded-2xl border shadow-xl ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-border bg-background"}`}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">Mood boosters</p>
                <div className="flex flex-wrap gap-2">
                  {emojiPalette.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => insertEmoji(emoji)}
                      className={`rounded-full border px-2 py-1 text-base transition ${isDarkMode ? "border-slate-700 bg-slate-800 hover:border-sky-500" : "border-border bg-muted/40 hover:border-primary"}`}
                      aria-label={`Insert ${emoji}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button type="button" variant="ghost" size="icon"
              className={isDarkMode ? "text-slate-300 hover:text-white" : "text-muted-foreground hover:text-primary"}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <textarea value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)}
              placeholder={`Message ${selectedUser.name}`} rows={1}
              className={`flex-1 resize-none bg-transparent text-sm focus:outline-none focus:ring-0 placeholder:text-slate-400 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}
              aria-label={`Message ${selectedUser.name}`} />
            <Button onClick={handleSendMessage} disabled={!canSendMessage} size="icon"
              className={`ml-auto rounded-full border transition-all duration-200 ${
                canSendMessage
                  ? isDarkMode
                    ? "border-sky-500 bg-gradient-to-r from-sky-500 via-sky-500 to-sky-400 text-white hover:shadow-lg hover:shadow-sky-500/40"
                    : "border-primary bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:shadow-lg hover:shadow-primary/40"
                  : isDarkMode ? "border-slate-700 bg-slate-800 text-slate-500" : "border-slate-200 bg-slate-100 text-slate-400"
              }`}>
              <Send className={`h-4 w-4 ${canSendMessage ? "opacity-100" : "opacity-70"}`} />
            </Button>
          </div>
        </>
      ) : (
        <div className={`flex flex-1 flex-col items-center justify-center text-center ${isDarkMode ? "text-slate-400" : "text-muted-foreground"}`}>
          <MessageCircle className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">Select a user from the directory to start chatting.</p>
        </div>
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right"
        className="w-[95vw] sm:max-w-3xl lg:max-w-4xl h-screen max-h-screen flex flex-col gap-4 overflow-hidden p-0 sm:p-6">
        <SheetHeader className="px-4 pt-4 sm:px-0">
          <SheetTitle className="text-xl">Communications Hub</SheetTitle>
          <SheetDescription>Keep every student, coordinator, and admin within reach.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 sm:px-0">
          <div className="hidden flex-1 min-h-0 gap-4 md:grid md:grid-cols-[260px_minmax(0,1fr)]">
            {directoryPanel}
            {conversationPanel}
          </div>
          <div className="flex-1 min-h-0 md:hidden">
            <Tabs defaultValue="chat" className="flex h-full flex-col">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/40">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="people">People</TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="mt-4 flex-1">{conversationPanel}</TabsContent>
              <TabsContent value="people" className="mt-4 flex-1">{directoryPanel}</TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
