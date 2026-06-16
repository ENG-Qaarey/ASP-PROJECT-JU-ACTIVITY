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
  Copy, SmilePlus, Users, Search, Phone, Video, Smile, Image,
  Pause, Undo2, Timer,
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

function WaveformVisualizer({ audioUrl, isMine, isPlaying: controlledPlaying, onPlayPause }: {
  audioUrl: string;
  isMine: boolean;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const actualPlaying = controlledPlaying !== undefined ? controlledPlaying : isPlaying;

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawStaticWaveform = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bars = 40;
      for (let i = 0; i < bars; i++) {
        const barHeight = Math.max(2, Math.sin((i / bars) * Math.PI * 3) * h * 0.6 + h * 0.2 + Math.random() * 4);
        const x = (i / bars) * w;
        const barW = w / bars - 1.5;
        ctx.fillStyle = isMine ? "rgba(255,255,255,0.5)" : "hsl(var(--primary))";
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.roundRect(x, h - barHeight, barW, barHeight, 2);
        ctx.fill();
      }
    };
    drawStaticWaveform();
  }, [isMine]);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    });

    return () => {
      audio.pause();
      audio.src = "";
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (onPlayPause) { onPlayPause(); return; }
    const audio = audioRef.current;
    if (!audio) return;
    if (actualPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    } else {
      audio.play();
      setIsPlaying(true);
      if (!audioCtxRef.current) {
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        const source = audioCtx.createMediaElementSource(audio);
        sourceRef.current = source;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
      }
      const animate = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx || !analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const bars = 40;
        for (let i = 0; i < bars; i++) {
          const idx = Math.floor((i / bars) * dataArray.length);
          const barHeight = Math.max(2, (dataArray[idx] / 255) * h);
          const x = (i / bars) * w;
          const barW = w / bars - 1.5;
          ctx.fillStyle = isMine ? "rgba(255,255,255,0.8)" : "hsl(var(--primary))";
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.roundRect(x, h - barHeight, barW, barHeight, 2);
          ctx.fill();
        }
        animRef.current = requestAnimationFrame(animate);
      };
      animate();
    }
  };

  const formatDur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className={`flex items-center gap-2 py-1 ${isMine ? "flex-row" : ""}`}>
      <button onClick={togglePlay}
        className={`rounded-full p-1.5 shrink-0 transition-all hover:scale-110 ${
          isMine ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 hover:bg-primary/20"
        }`}>
        {actualPlaying
          ? <Pause className={`h-3.5 w-3.5 ${isMine ? "text-white" : "text-primary"}`} />
          : <Play className={`h-3.5 w-3.5 ${isMine ? "text-white" : "text-primary"}`} />
        }
      </button>
      <div className="relative flex-1 h-8">
        <canvas ref={canvasRef} width={120} height={32} className="w-full h-full rounded" />
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 h-0.5 bg-primary/40 rounded-full"
            style={{ width: `${progress * 100}%` }} />
        )}
      </div>
      <span className={`text-[11px] font-medium tabular-nums ${isMine ? "text-white/80" : "text-muted-foreground"}`}>
        {formatDur(actualPlaying ? currentTime : duration)}
      </span>
    </div>
  );
}

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
  const [recordingTimer, setRecordingTimer] = useState(0);
  const recordingTimerRef = useRef<number | null>(null);
  const [recordingWaveform, setRecordingWaveform] = useState<number[]>([]);
  const recordingAnalyserRef = useRef<AnalyserNode | null>(null);
  const recordingAnimationRef = useRef<number | null>(null);
  const recordingCancelledRef = useRef(false);
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
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      recordingAnalyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      setRecordingTimer(0);
      setRecordingWaveform(Array(30).fill(2));

      const tick = () => {
        setRecordingTimer((t) => t + 1);
        recordingTimerRef.current = window.setTimeout(tick, 1000);
      };
      tick();

      const drawWaveform = () => {
        if (!recordingAnalyserRef.current) return;
        const dataArray = new Uint8Array(recordingAnalyserRef.current.frequencyBinCount);
        recordingAnalyserRef.current.getByteTimeDomainData(dataArray);
        const bars = 30;
        const samples: number[] = [];
        for (let i = 0; i < bars; i++) {
          const idx = Math.floor((i / bars) * dataArray.length);
          const val = Math.abs(dataArray[idx] - 128) / 128;
          samples.push(Math.max(2, val * 24));
        }
        setRecordingWaveform(samples);
        recordingAnimationRef.current = requestAnimationFrame(drawWaveform);
      };
      drawWaveform();

      recordingCancelledRef.current = false;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
        if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
        if (recordingAnimationRef.current) cancelAnimationFrame(recordingAnimationRef.current);
        if (recordingCancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }
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
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (recordingAnimationRef.current) cancelAnimationFrame(recordingAnimationRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recording) {
      recordingCancelledRef.current = true;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      setRecording(false);
      setRecordingTimer(0);
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (recordingAnimationRef.current) cancelAnimationFrame(recordingAnimationRef.current);
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
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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

            {!editingId && (
              <div className={`absolute -top-8 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 ${
                isMine ? "left-0" : "right-0"
              }`}>
                <div className="flex items-center gap-0.5 rounded-full bg-background/90 backdrop-blur-md border border-border/40 shadow-lg px-1 py-0.5">
                  <button onClick={() => handleCopy(msg.id, msg.content)}
                    className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                    title="Copy">
                    {copiedId === msg.id ? <CheckCheck className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  </button>
                  {isMine && (
                    <button onClick={() => { setEditingId(msg.id); setEditInput(msg.content); }}
                      className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                      title="Edit">
                      <Edit3 className="h-3 w-3" />
                    </button>
                  )}
                  {isMine && (
                    <button onClick={() => handleDelete(msg.id)}
                      className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className={`px-4 py-2.5 text-sm break-words overflow-hidden ${
              isMine
                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl rounded-br-sm shadow-lg shadow-primary/20"
                : "bg-card border border-border/60 rounded-2xl rounded-bl-sm shadow-sm"
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
                    <div className="-mx-1">
                      <WaveformVisualizer audioUrl={metadata.url} isMine={isMine} />
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
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="flex items-center gap-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/30 shadow-sm px-1 py-0.5">
                    {EMOJIS.slice(0, 4).map((emoji) => (
                      <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                        className="h-5 w-5 rounded-full flex items-center justify-center text-xs hover:bg-accent hover:scale-110 transition-all">
                        {emoji}
                      </button>
                    ))}
                    <div className="w-px h-3 bg-border/40 mx-0.5" />
                    <button onClick={() => { setReplyTo({ id: msg.id, content: msg.content, senderName: msg.senderName }); }}
                      className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                      <Reply className="h-2.5 w-2.5 text-muted-foreground/70" />
                    </button>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground/60 inline-flex items-center gap-1 ml-auto">
                  {formatTime(msg.createdAt)}
                  {msg.editedAt && <span className="italic font-medium text-muted-foreground/40">edited</span>}
                </span>
                {isMine && (
                  <CheckCheck className="h-3 w-3 text-blue-400 drop-shadow-sm" />
                )}
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
      <div className="flex flex-col flex-1 bg-gradient-to-b from-background via-background to-accent/20 min-h-0">
        {/* Channel header */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-card/60 backdrop-blur-xl px-3 sm:px-4 h-14 shrink-0 shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}
            className="rounded-full hover:bg-accent/70 shrink-0 h-8 w-8 sm:h-9 sm:w-9 transition-colors">
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-background shadow-md">
                <AvatarFallback className="text-sm bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                  {(currentActivity?.title || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate leading-tight text-foreground/90">{currentActivity?.title || "Activity Chat"}</h2>
              <div className="flex items-center gap-1.5 mt-px">
                <span className="text-[11px] text-emerald-400/80 font-medium">Online</span>
                <span className="text-[11px] text-muted-foreground/30">·</span>
                {members.length > 0 && (
                  <div className="hidden sm:flex -space-x-1.5 items-center mr-0.5">
                    {members.slice(0, 4).map((m) => (
                      <Avatar key={m.id} className="h-5 w-5 ring-1 ring-background shadow-sm">
                        <AvatarImage src={m.avatar} />
                        <AvatarFallback className="text-[8px] bg-muted text-muted-foreground font-medium">{m.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                    {members.length > 4 && (
                      <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground text-[8px] font-medium flex items-center justify-center ring-1 ring-background shadow-sm">
                        +{members.length - 4}
                      </span>
                    )}
                  </div>
                )}
                <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">{members.length} member{members.length !== 1 ? "s" : ""}</span>
                <span className="text-[11px] text-muted-foreground/30">·</span>
                <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">{total} message{total !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-px sm:gap-0.5">
            <Button variant="ghost" size="icon"
              className="rounded-full h-8 w-8 sm:h-9 sm:w-9 hover:bg-accent/70 hidden sm:inline-flex transition-colors" title="Voice call">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon"
              className="rounded-full h-8 w-8 sm:h-9 sm:w-9 hover:bg-accent/70 hidden sm:inline-flex transition-colors" title="Video call">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon"
              className="rounded-full h-8 w-8 sm:h-9 sm:w-9 hover:bg-accent/70 hidden sm:inline-flex transition-colors" title="Search in chat">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant={showMembers ? "secondary" : "ghost"} size="icon"
              className={`rounded-full h-8 w-8 sm:h-9 sm:w-9 transition-colors ${showMembers ? "bg-primary/10 text-primary" : "hover:bg-accent/70"}`}
              onClick={() => setShowMembers(!showMembers)} title="Members">
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
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
                    <div className="flex h-full items-center justify-center">
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-center">
                        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5
                          flex items-center justify-center ring-2 ring-primary/10 shadow-xl shadow-primary/5">
                          <MessageCircle className="w-9 h-9 text-primary/50" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground/90 mb-1.5">Start the conversation</h3>
                        <p className="text-sm text-muted-foreground/70 max-w-[200px] mx-auto leading-relaxed">
                          Send the first message to begin chatting
                        </p>
                        <motion.div initial={{ width: 0 }} animate={{ width: 40 }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                          className="h-0.5 bg-primary/30 rounded-full mx-auto mt-4" />
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
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="border-t border-border/40 bg-card/90 backdrop-blur-lg px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
              <div className="flex flex-wrap gap-1.5 justify-center">
                {["😀","😃","😄","😁","😅","😂","🤣","😊","😇","🙂","😉","😌","😍","🥰","😘","😗","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","😮","😯","😲","😳","🥺","😢","😭","😤","😡","😠","🤬","😈","👿","💀","💩","🤡","👹","👺","👻","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾","💋","👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁","👅","👄","💘","❤️","🩷","🧡","💛","💚","💙","🩵","💜","🖤","🩶","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💝","💟","♥️","🫶","🔥","⭐","🌟","✨","💫","🎉","🎊","🎈","🎁","🎀","🪄","🔮","💎","🌊","🌈","☀️","🌙","⭐️","⚡️","☄️","💥","🔥","🌈","🍕","🍔","🍟","🌭","🍿","🧁","🍦","🍩","🍪","🍫","🍬","🍭","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","☕️","🍵","🥤","🧃"].map((emoji) => (
                  <button key={emoji} onClick={() => { setInput((prev) => prev + emoji); setShowEmojiPicker(false); }}
                    className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-95">
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-card/70 backdrop-blur-xl px-3 sm:px-4 py-2.5 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-end gap-1.5 max-w-4xl mx-auto">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" />
            <Button variant="ghost" size="icon"
              className={`rounded-full h-9 w-9 shrink-0 transition-colors ${showEmojiPicker ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji">
              <Smile className="h-4.5 w-4.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 shrink-0 hover:bg-accent" disabled={uploading} title="Attach file">
                  <Paperclip className="h-4.5 w-4.5 text-muted-foreground/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl">
                <DropdownMenuLabel className="text-xs font-medium">Attach</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleFilePick} className="rounded-lg gap-2">
                  <Image className="h-4 w-4" /> Photos & Videos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFilePick} className="rounded-lg gap-2">
                  <FileIcon className="h-4 w-4" /> Document
                </DropdownMenuItem>
                <DropdownMenuItem onClick={startRecording} className="rounded-lg gap-2">
                  <Mic className="h-4 w-4" /> Voice message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex-1 relative">
              {recording ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse shadow-lg shadow-destructive/30" />
                    <span className="text-xs font-semibold text-destructive/80">Recording</span>
                  </div>
                  <div className="flex items-end gap-[2px] h-6 flex-1">
                    {recordingWaveform.map((h, i) => (
                      <span key={i} className="flex-1 rounded-full bg-destructive transition-all duration-75"
                        style={{ height: `${Math.max(2, h)}px`, opacity: Math.max(0.3, h / 24) }} />
                    ))}
                  </div>
                  <span className="text-xs font-medium tabular-nums text-destructive/80 shrink-0">
                    {Math.floor(recordingTimer / 60)}:{(recordingTimer % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              ) : (
                <textarea ref={textareaRef} value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={uploading ? "Uploading..." : "Type a message..."}
                  disabled={sending || uploading}
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-input/70 bg-background/60 backdrop-blur-sm px-4 py-2.5 text-sm shadow-sm transition-all placeholder:text-muted-foreground/40
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/40
                    disabled:opacity-50 max-h-[120px] leading-relaxed"
                />
              )}
            </div>
            {recording ? (
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon"
                  className="rounded-full h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={cancelRecording} title="Cancel recording">
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button size="icon"
                  className="rounded-full h-9 w-9 bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/30 transition-all"
                  onClick={stopRecording} title="Send recording">
                  <Square className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="icon"
                  className="rounded-full h-9 w-9 shrink-0 hover:bg-accent transition-colors"
                  onClick={startRecording} disabled={uploading} title="Record voice">
                  <Mic className="h-4.5 w-4.5 text-muted-foreground/70" />
                </Button>
                <Button size="icon"
                  className="rounded-full h-9 w-9 shrink-0 bg-primary hover:bg-primary/90 shadow-md disabled:shadow-none transition-all active:scale-95"
                  onClick={handleSend} disabled={!input.trim() || sending || uploading}>
                  {sending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
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
