import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { messagesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ChatRoomSkeleton from "./ChatRoomSkeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Send, Paperclip, Mic, Square, FileIcon, Play, X,
  ChevronDown, CheckCheck, MessageCircle, Trash2, Edit3, Reply,
  Copy, SmilePlus, Users, Search, Phone, Video, Smile,
} from "lucide-react";

interface ChatMessage {
  id: string;
  activityId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  content: string;
  type: string;
  metadata?: string | null;
  createdAt: string;
  editedAt?: string | null;
  reactions?: string | null;
  parentId?: string | null;
  parent?: { id: string; content: string; senderName: string } | null;
  isDeleted?: boolean;
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];

const ChatRoomPage = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activities } = useActivity();
  const currentUserId = user?.id || "";
  const currentActivity = activities.find((a) => a.id === activityId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const isNearBottomRef = useRef(true);
  const offsetRef = useRef(0);
  const PAGE_SIZE = 50;

  const scrollToBottom = () => {
    setTimeout(() => {
      if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      }
    }, 50);
  };

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const isNearBottom = () => {
    const el = viewportRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  };

  const handleScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 150);
    isNearBottomRef.current = distanceFromBottom < 150;

    if (el.scrollTop < 80 && hasMore && !loadingMore) {
      loadMore();
    }
  }, [hasMore, loadingMore]);

  const loadMessages = async (append = false) => {
    if (!activityId) return;
    try {
      const data = await messagesApi.getByActivity(activityId, offsetRef.current, PAGE_SIZE);
      if (append) {
        const prevHeight = viewportRef.current?.scrollHeight || 0;
        setMessages((prev) => [...data.messages, ...prev]);
        setTotal(data.total);
        setHasMore(offsetRef.current + PAGE_SIZE < data.total);
        offsetRef.current += PAGE_SIZE;
        requestAnimationFrame(() => {
          if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight - prevHeight;
          }
        });
      } else {
        setMessages(data.messages);
        setTotal(data.total);
        offsetRef.current = data.messages.length;
        setHasMore(data.messages.length < data.total);
        setLoading(false);
        scrollToBottom();
      }
    } catch {
      if (!append) setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadMessages(true);
    setLoadingMore(false);
  };

  const loadMembers = async () => {
    if (!activityId) return;
    try {
      const data = await messagesApi.getMembers(activityId);
      setMembers(data);
    } catch {}
  };

  useEffect(() => {
    if (!activityId) return;

    let cancelled = false;

    const init = async () => {
      offsetRef.current = 0;
      setLoading(true);

      await loadMessages(false);
      loadMembers();
      messagesApi.markAsRead(activityId).catch(() => {});

      const token = localStorage.getItem("token");
      if (!token) return;

      const connection = new HubConnectionBuilder()
        .withUrl("/hubs/notifications", {
          accessTokenFactory: () => localStorage.getItem("token") ?? "",
        })
        .withAutomaticReconnect()
        .build();

      connection.on("ReceiveMessage", (message: ChatMessage) => {
        if (message.activityId === activityId) {
          setMessages((prev) => {
            const tempIdx = prev.findIndex((m) => m.id.startsWith("temp-") && m.content === message.content && m.senderId === message.senderId);
            if (tempIdx >= 0) {
              const next = [...prev];
              next[tempIdx] = message;
              return next;
            }
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
          if (isNearBottomRef.current) scrollToBottom();
          else setNewMessageCount((c) => c + 1);
        }
      });

      connection.on("MessageDeleted", (data: { id: string; activityId: string }) => {
        setMessages((prev) => prev.filter((m) => m.id !== data.id));
      });

      connection.on("MessageEdited", (message: ChatMessage) => {
        setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
      });

      connection.on("MessageReacted", (message: ChatMessage) => {
        setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
      });

      connection.on("UserTyping", (data: { activityId: string; userId: string }) => {
        if (data.userId !== currentUserId) {
          setTypingUsers((prev) => prev.includes(data.userId) ? prev : [...prev, data.userId]);
        }
      });

      connection.on("UserStoppedTyping", (data: { activityId: string; userId: string }) => {
        setTypingUsers((prev) => prev.filter((u) => u !== data.userId));
      });

      try {
        await connection.start();
        await connection.invoke("JoinActivity", activityId);
        connectionRef.current = connection;
      } catch (err) {
        console.error("SignalR chat connection failed:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (connectionRef.current) {
        connectionRef.current
          .invoke("LeaveActivity", activityId)
          .then(() => connectionRef.current?.stop())
          .catch(() => connectionRef.current?.stop());
        connectionRef.current = null;
      }
    };
  }, [activityId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const viewport = el.querySelector<HTMLDivElement>("[data-radix-scroll-area-viewport]");
    if (viewport) {
      viewportRef.current = viewport;
      viewport.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (viewport) viewport.removeEventListener("scroll", handleScroll);
    };
  }, [loading]);

  const emitTyping = useCallback(async () => {
    if (!connectionRef.current || !activityId) return;
    try {
      await connectionRef.current.invoke("UserTyping", activityId);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(async () => {
        try {
          await connectionRef.current?.invoke("UserStoppedTyping", activityId);
        } catch {}
      }, 2000);
    } catch {}
  }, [activityId]);

  const sendMessage = async (
    content: string,
    type?: string,
    metadata?: string,
    parentId?: string
  ) => {
    if (!content.trim() || !activityId || sending) return;
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      activityId,
      senderId: currentUserId,
      senderName: user?.name || "You",
      senderAvatar: user?.avatar || null,
      content: content.trim(),
      type: type || "text",
      metadata: metadata || null,
      createdAt: new Date().toISOString(),
      parentId: parentId || null,
      parent: parentId && replyTo ? { id: parentId, content: replyTo.content, senderName: replyTo.senderName } : null,
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();
    setSending(true);
    try {
      await messagesApi.send(activityId, content.trim(), type, metadata, parentId);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const replyId = replyTo?.id;
    setReplyTo(null);
    sendMessage(text, undefined, undefined, replyId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResize();
    emitTyping();
  };

  // File upload
  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activityId) return;
    setUploading(true);
    try {
      const result = await messagesApi.upload(activityId, file);
      const isImage = result.contentType.startsWith("image/");
      const isVideo = result.contentType.startsWith("video/");
      const isAudio = result.contentType.startsWith("audio/");
      const msgType = isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : "file";
      await messagesApi.send(
        activityId, file.name, msgType,
        JSON.stringify({ url: result.url, fileName: result.fileName, size: result.size, contentType: result.contentType }),
        replyTo?.id
      );
      setReplyTo(null);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size > 0 && activityId) {
          const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
          setUploading(true);
          try {
            const result = await messagesApi.upload(activityId, file);
            await messagesApi.send(activityId, "Voice message", "audio",
              JSON.stringify({ url: result.url, fileName: result.fileName, size: result.size, contentType: result.contentType }),
              replyTo?.id
            );
            setReplyTo(null);
          } catch (err) { console.error("Voice upload failed:", err); }
          finally { setUploading(false); }
        }
      };
      recorder.start();
      setRecording(true);
    } catch (err) { console.error("Mic access denied:", err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Message actions
  const handleDelete = async (id: string) => {
    try { await messagesApi.delete(id); } catch {}
  };

  const handleEdit = async (id: string) => {
    if (!editInput.trim()) return;
    try {
      await messagesApi.edit(id, editInput.trim());
      setEditingId(null);
      setEditInput("");
    } catch {}
  };

  const handleReact = async (id: string, emoji: string) => {
    try { await messagesApi.toggleReaction(id, emoji); } catch {}
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  // Formatting
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const groupedMessages = messages.reduce<{ date: string; items: ChatMessage[] }[]>((groups, msg) => {
    const label = formatDateLabel(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.date === label) last.items.push(msg);
    else groups.push({ date: label, items: [msg] });
    return groups;
  }, []);

  const parseReactions = (raw: string | null | undefined): { emoji: string; users: string[] }[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((r: any) => ({
        emoji: r.emoji || r.Emoji || "",
        users: r.users || r.Users || [],
      }));
    } catch { return []; }
  };

  const renderMessage = (msg: ChatMessage, isMine: boolean, showAvatar = true, showSender = true) => {
    let metadata: any = null;
    try { if (msg.metadata) metadata = JSON.parse(msg.metadata); } catch {}
    const senderMember = members.find((m) => m.id === msg.senderId);
    const isCoordinator = senderMember?.role === "coordinator";
    const isAdmin = senderMember?.role === "admin";

    const reactions = parseReactions(msg.reactions);

    const avatar = (
      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background shadow-md">
        <AvatarImage src={msg.senderAvatar ?? undefined} />
        <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
          {(msg.senderName || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
        </AvatarFallback>
      </Avatar>
    );

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`flex items-end gap-2 px-1 group ${isMine ? "flex-row-reverse" : ""}`}
      >
        {!isMine && showAvatar && avatar}
        {!isMine && !showAvatar && <div className="w-8 shrink-0" />}
        <div className={`flex flex-col gap-0.5 max-w-[78%] sm:max-w-[70%] ${isMine ? "items-end" : ""}`}>
          {!isMine && showSender && (
            <span className="text-[11px] font-medium text-muted-foreground/80 px-1 flex items-center gap-1.5">
              {msg.senderName || "Unknown"}
              {(isCoordinator || isAdmin) && (
                <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                  {isAdmin ? "Admin" : "Coordinator"}
                </span>
              )}
            </span>
          )}
          <div className="relative">
            {/* Reply parent preview */}
            {msg.parent && (
              <div className={`mb-1 px-3 py-1.5 rounded-lg text-xs border-l-2 ${
                isMine ? "bg-primary-foreground/10 border-primary-foreground/30" : "bg-muted/50 border-muted-foreground/30"
              }`}>
                <p className="font-medium text-[11px] text-muted-foreground/70">{msg.parent.senderName}</p>
                <p className="truncate text-muted-foreground/60">{msg.parent.content}</p>
              </div>
            )}

            {/* Action buttons (on hover) */}
            {isMine && !editingId && (
              <div className={`absolute -top-7 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                isMine ? "left-0 flex-row" : "right-0 flex-row-reverse"
              }`}>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                  onClick={() => handleCopy(msg.id, msg.content)} title="Copy">
                  {copiedId === msg.id ? <CheckCheck className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                  onClick={() => { setEditingId(msg.id); setEditInput(msg.content); }} title="Edit">
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:text-destructive"
                  onClick={() => handleDelete(msg.id)} title="Delete">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className={`rounded-2xl px-4 py-2.5 text-sm break-words overflow-hidden shadow-sm ${
              isMine
                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-md shadow-primary/20"
                : "bg-card border border-border/60 rounded-bl-md shadow-sm"
            }`}>
              {/* Editing mode */}
              {editingId === msg.id ? (
                <div className="flex gap-2">
                  <input
                    value={editInput}
                    onChange={(e) => setEditInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEdit(msg.id); } }}
                    className="flex-1 bg-transparent border-b border-current outline-none text-sm"
                    autoFocus
                  />
                  <Button size="icon" className="h-7 w-7 rounded-full shrink-0" onClick={() => handleEdit(msg.id)}>
                    <Send className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full shrink-0" onClick={() => { setEditingId(null); setEditInput(""); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  {msg.type === "image" && metadata?.url && (
                    <div className="-mx-1 -mt-1 mb-1.5">
                      <img src={metadata.url} alt={msg.content}
                        className="max-w-full rounded-xl cursor-pointer hover:opacity-90 max-h-64 object-cover transition-opacity"
                        onClick={() => setExpandedImage(metadata.url)} />
                    </div>
                  )}
                  {msg.type === "video" && metadata?.url && (
                    <div className="-mx-1 -mt-1 mb-1.5">
                      <video src={metadata.url} controls className="max-w-full rounded-xl max-h-64" preload="metadata" />
                    </div>
                  )}
                  {msg.type === "audio" && metadata?.url && (
                    <div className="flex items-center gap-2 py-1">
                      <div className={`rounded-full p-1.5 ${isMine ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
                        <Play className={`h-3.5 w-3.5 ${isMine ? "text-primary-foreground" : "text-primary"}`} />
                      </div>
                      <audio src={metadata.url} controls className="max-w-full h-8 flex-1" preload="none" />
                    </div>
                  )}
                  {msg.type === "file" && metadata?.url && (
                    <a href={metadata.url} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2.5 text-sm rounded-lg p-2 ${
                        isMine ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-muted/50 hover:bg-muted"
                      } transition-colors`}>
                      <div className={`rounded-lg p-1.5 ${isMine ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
                        <FileIcon className={`h-4 w-4 ${isMine ? "text-primary-foreground" : "text-primary"}`} />
                      </div>
                      <span className="underline-offset-2 underline truncate flex-1 min-w-0">{metadata.fileName || msg.content}</span>
                    </a>
                  )}
                  {msg.type === "text" && <span className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</span>}
                </>
              )}

              {/* Reactions */}
              {!editingId && reactions.length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-1.5 ${isMine ? "justify-end" : "justify-start"}`}>
                  {reactions.map((r) => (
                    <button key={r.emoji}
                      onClick={() => handleReact(msg.id, r.emoji)}
                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs border transition-colors ${
                        r.users.includes(currentUserId)
                          ? "bg-primary/20 border-primary/40 text-primary-foreground"
                          : "bg-background/50 border-border/40 text-muted-foreground"
                      }`}>
                      {r.emoji}<span className="text-[10px]">{r.users.length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reactions bar + actions row */}
            {!editingId && (
              <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "flex-row-reverse" : ""}`}>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {EMOJIS.slice(0, 4).map((emoji) => (
                    <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                      className="h-5 w-5 rounded-full bg-background/80 backdrop-blur-sm shadow-sm text-xs hover:scale-110 transition-transform">
                      {emoji}
                    </button>
                  ))}
                  <button onClick={() => { setReplyTo({ id: msg.id, content: msg.content, senderName: msg.senderName }); }}
                    className="h-5 w-5 rounded-full bg-background/80 backdrop-blur-sm shadow-sm flex items-center justify-center hover:scale-110 transition-transform">
                    <Reply className="h-2.5 w-2.5" />
                  </button>
                </div>
                <span className="text-[10px] text-muted-foreground/60 ml-auto">
                  {formatTime(msg.createdAt)}
                  {msg.editedAt && <span className="ml-1 italic">(edited)</span>}
                </span>
                {isMine && <CheckCheck className="h-3 w-3 text-primary/50" />}
              </div>
            )}
          </div>
        </div>
        {isMine && avatar}
      </motion.div>
    );
  };

  if (!activityId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No activity selected.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="fixed inset-0 top-14 lg:left-64 z-30 flex flex-col bg-gradient-to-b from-background via-background to-accent/20">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-card/80 backdrop-blur-md px-3 py-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-accent shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{(currentActivity?.title || "A").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate">{currentActivity?.title || "Activity Chat"}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                {members.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {members.slice(0, 4).map((m) => (
                      <Avatar key={m.id} className="h-5 w-5 ring-1 ring-background">
                        <AvatarFallback className="text-[8px] bg-muted text-muted-foreground font-medium">{m.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                    {members.length > 4 && (
                      <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground text-[8px] font-medium flex items-center justify-center ring-1 ring-background">
                        +{members.length - 4}
                      </span>
                    )}
                  </div>
                )}
                <span className="text-[11px] text-muted-foreground/50">{members.length} member{members.length !== 1 ? "s" : ""}</span>
                <span className="text-[11px] text-muted-foreground/30">·</span>
                <span className="text-[11px] text-muted-foreground/50">{total} message{total !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-accent hidden sm:inline-flex" title="Voice call">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-accent hidden sm:inline-flex" title="Video call">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-accent hidden sm:inline-flex" title="Search in chat">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-accent" onClick={() => setShowMembers(!showMembers)} title="Members">
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 relative overflow-hidden">
            <ScrollArea ref={scrollRef} className="h-full px-3 sm:px-4 py-3">
              {loading ? (
                <ChatRoomSkeleton />
              ) : (
                <>
                  {loadingMore && (
                    <div className="flex justify-center py-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                  {!hasMore && messages.length > 0 && (
                    <div className="text-center text-[10px] text-muted-foreground/40 py-2 font-medium">
                      Beginning of conversation
                    </div>
                  )}
                  {groupedMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-7 h-7 text-primary/60" />
                        </div>
                        <p className="text-base font-semibold text-foreground/80 mb-1">No messages yet</p>
                        <p className="text-muted-foreground/70">Be the first to send a message!</p>
                      </motion.div>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {groupedMessages.map((group) => (
                        <div key={group.date} className="mb-5">
                          <div className="flex items-center justify-center mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                            </div>
                            <span className="inline-flex items-center rounded-full border border-border/60 bg-card/80 backdrop-blur-sm px-3.5 py-1 text-[11px] font-semibold text-muted-foreground/80 shadow-sm mx-3">
                              {group.date}
                            </span>
                            <div className="flex items-center gap-3 flex-1">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            {group.items.map((msg, idx) => {
                              const prev = idx > 0 ? group.items[idx - 1] : null;
                              const sameSender = prev && prev.senderId === msg.senderId;
                              const timeDiff = sameSender
                                ? new Date(msg.createdAt).getTime() - new Date(prev!.createdAt).getTime()
                                : Infinity;
                              const isConsecutive = sameSender && timeDiff < 5 * 60 * 1000;
                              return renderMessage(msg, msg.senderId === currentUserId, !isConsecutive, !isConsecutive);
                            })}
                          </div>
                        </div>
                      ))}
                    </AnimatePresence>
                  )}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground/60">
                      <div className="flex gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span>
                        {typingUsers.length === 1
                          ? `${members.find((m) => m.id === typingUsers[0])?.name || "Someone"} is typing...`
                          : `${typingUsers.length} people are typing...`}
                      </span>
                    </div>
                  )}

                  {/* Bottom spacer for scroll anchor */}
                  <div className="h-2" />
                </>
              )}
            </ScrollArea>

            <AnimatePresence>
              {showScrollBtn && !loading && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <Button size="icon" className="rounded-full h-9 w-9 shadow-lg shadow-primary/20" onClick={scrollToBottom}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            {newMessageCount > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <Button variant="secondary" size="sm" className="rounded-full h-7 shadow-md text-xs gap-1.5 font-medium"
                  onClick={() => { scrollToBottom(); setNewMessageCount(0); }}>
                  <ChevronDown className="h-3 w-3" />
                  {newMessageCount} new message{newMessageCount > 1 ? "s" : ""}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Members Panel */}
          <AnimatePresence>
            {showMembers && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                className="border-l border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden shrink-0 hidden sm:block">
                <div className="w-[260px] p-4">
                  <h3 className="font-semibold text-sm mb-3">Members ({members.length})</h3>
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.avatar} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {m.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground/60 capitalize">{m.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div className="border-t border-border/40 bg-accent/30 px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Reply className="h-3 w-3 shrink-0" />
            <span className="font-medium shrink-0">Replying to {replyTo.senderName}</span>
            <span className="truncate flex-1">"{replyTo.content}"</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => setReplyTo(null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Emoji picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="border-t border-border/40 bg-card/80 backdrop-blur-md px-4 py-2">
              <div className="flex gap-1.5">
                {EMOJIS.map((emoji) => (
                  <button key={emoji} onClick={() => { setInput((prev) => prev + emoji); setShowEmojiPicker(false); }}
                    className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center text-lg transition-colors">
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="border-t border-border/60 bg-card/80 backdrop-blur-md px-3 sm:px-4 py-3 shrink-0">
          <div className="flex items-center gap-1.5 max-w-4xl mx-auto">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" />
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 shrink-0 hover:bg-accent"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji">
              <Smile className="h-5 w-5 text-muted-foreground/70" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 shrink-0 hover:bg-accent" disabled={uploading} title="Attach file">
                  <Paperclip className="h-5 w-5 text-muted-foreground/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Attach</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleFilePick}>
                  <Image className="h-4 w-4" /> Photos & Videos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFilePick}>
                  <FileIcon className="h-4 w-4" /> Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex-1 relative">
              <textarea ref={textareaRef} value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={uploading ? "Uploading..." : "Type a message..."}
                disabled={sending || uploading || recording}
                rows={1}
                className="w-full resize-none rounded-2xl border border-input/80 bg-background/80 backdrop-blur-sm px-4 py-2.5 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary/50 disabled:opacity-50 max-h-[160px]"
              />
            </div>
            {recording ? (
              <Button variant="destructive" size="icon" className="rounded-full h-10 w-10 shrink-0 animate-pulse shadow-lg shadow-destructive/30"
                onClick={stopRecording} title="Stop recording">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 shrink-0 hover:bg-accent"
                onClick={startRecording} disabled={uploading} title="Record voice">
                <Mic className="h-5 w-5 text-muted-foreground/70" />
              </Button>
            )}
            <Button size="icon" className="rounded-full h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 shadow-md disabled:shadow-none"
              onClick={handleSend} disabled={!input.trim() || sending || uploading || recording}>
              {sending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 cursor-pointer"
            onClick={() => setExpandedImage(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={() => setExpandedImage(null)}>
                <X className="h-5 w-5" />
              </Button>
              <img src={expandedImage} alt="Expanded" className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default ChatRoomPage;
