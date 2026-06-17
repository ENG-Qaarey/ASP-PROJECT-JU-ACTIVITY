import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, MessageCircle } from "lucide-react";
import { messagesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ChatRoomSkeleton from "@/pages/chat/ChatRoomSkeleton";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import MembersPanel from "@/components/chat/MembersPanel";
import { ChatMessage, Member, ReplyTo } from "@/types/chat";
import { groupByDate, formatTime } from "@/lib/format";

const PAGE_SIZE = 50;

interface ChatRoomViewProps {
  activityId: string;
  activityTitle: string;
}

export default function ChatRoomView({ activityId, activityTitle }: ChatRoomViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rolePrefix = user?.role === "admin" ? "admin" : user?.role === "coordinator" ? "coordinator" : "student";
  const currentUserId = user?.id || "";

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
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const isNearBottomRef = useRef(true);
  const offsetRef = useRef(0);

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
    if (el.scrollTop < 80 && hasMore && !loadingMore) loadMore();
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
          if (viewportRef.current) viewportRef.current.scrollTop = viewportRef.current.scrollHeight - prevHeight;
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
    } catch { /* members silently fail */ }
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
      } catch {
        toast({ title: "Connection Failed", description: "Could not connect to real-time chat.", variant: "destructive" });
      }
    };

    init();
    return () => {
      cancelled = true;
      if (connectionRef.current) {
        connectionRef.current.invoke("LeaveActivity", activityId)
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
        try { await connectionRef.current?.invoke("UserStoppedTyping", activityId); } catch { /* ignore */ }
      }, 2000);
    } catch { /* ignore */ }
  }, [activityId]);

  const sendMessage = async (content: string, type?: string, metadata?: string, parentId?: string) => {
    if (!content.trim() || !activityId || sending) return;
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      activityId, senderId: currentUserId, senderName: user?.name || "You",
      senderAvatar: user?.avatar || null, content: content.trim(), type: type || "text",
      metadata: metadata || null, createdAt: new Date().toISOString(),
      parentId: parentId || null,
      parent: parentId && replyTo ? { id: parentId, content: replyTo.content, senderName: replyTo.senderName } : null,
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();
    setSending(true);
    try {
      await messagesApi.send(activityId, content.trim(), type, metadata, parentId);
    } catch {
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
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResize();
    emitTyping();
  };

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
      await messagesApi.send(activityId, file.name, msgType,
        JSON.stringify({ url: result.url, fileName: result.fileName, size: result.size, contentType: result.contentType }),
        replyTo?.id);
      setReplyTo(null);
    } catch { /* upload failed */ }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
        if (recordingCancelledRef.current) { audioChunksRef.current = []; return; }
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size > 0 && activityId) {
          const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
          setUploading(true);
          try {
            const result = await messagesApi.upload(activityId, file);
            await messagesApi.send(activityId, "Voice message", "audio",
              JSON.stringify({ url: result.url, fileName: result.fileName, size: result.size, contentType: result.contentType }),
              replyTo?.id);
            setReplyTo(null);
          } catch { /* voice upload failed */ }
          finally { setUploading(false); }
        }
      };
      recorder.start();
      setRecording(true);
    } catch { /* mic access denied */ }
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

  const handleDelete = async (id: string) => {
    try { await messagesApi.delete(id); }
    catch { toast({ title: "Error", description: "Failed to delete message.", variant: "destructive" }); }
  };
  const handleEdit = async (id: string) => {
    if (!editInput.trim()) return;
    try {
      await messagesApi.edit(id, editInput.trim());
      setEditingId(null);
      setEditInput("");
    } catch { toast({ title: "Error", description: "Failed to edit message.", variant: "destructive" }); }
  };
  const handleReact = async (id: string, emoji: string) => {
    try { await messagesApi.toggleReaction(id, emoji); }
    catch { toast({ title: "Error", description: "Failed to add reaction.", variant: "destructive" }); }
  };
  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  const groupedMessages = groupByDate(messages);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background via-background to-accent/20">
      <ChatHeader
        title={activityTitle}
        members={members}
        total={total}
        showMembers={showMembers}
        onBack={() => navigate(`/${rolePrefix}/chat`)}
        onToggleMembers={() => setShowMembers(!showMembers)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
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
                      transition={{ duration: 0.5, ease: "easeOut" }} className="text-center">
                      <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5
                        flex items-center justify-center ring-2 ring-primary/10 shadow-xl shadow-primary/5">
                        <MessageCircle className="w-9 h-9 text-primary/50" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground/90 mb-1.5">Start the conversation</h3>
                      <p className="text-sm text-muted-foreground/70 max-w-[200px] mx-auto leading-relaxed">
                        Send the first message to begin chatting
                      </p>
                      <motion.div initial={{ width: 0 }} animate={{ width: 40 }}
                        transition={{ delay: 0.3, duration: 0.4 }} className="h-0.5 bg-primary/30 rounded-full mx-auto mt-4" />
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
                          <span className="inline-flex items-center rounded-full border border-border/60 bg-card/80 backdrop-blur-sm
                            px-3.5 py-1 text-[11px] font-semibold text-muted-foreground/80 shadow-sm mx-3">
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
                            return (
                              <MessageBubble
                                key={msg.id}
                                msg={msg}
                                isMine={msg.senderId === currentUserId}
                                showAvatar={!isConsecutive}
                                showSender={!isConsecutive}
                                currentUserId={currentUserId}
                                editingId={editingId}
                                editInput={editInput}
                                copiedId={copiedId}
                                members={members}
                                replyTo={replyTo}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onReact={handleReact}
                                onCopy={handleCopy}
                                onReply={setReplyTo}
                                onStartEdit={(id, content) => { setEditingId(id); setEditInput(content); }}
                                onCancelEdit={() => { setEditingId(null); setEditInput(""); }}
                                onSetEditInput={setEditInput}
                                onExpandImage={setExpandedImage}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                )}

                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground/60" aria-live="polite">
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

        <MembersPanel show={showMembers} members={members} />
      </div>

      <ChatInput
        input={input}
        sending={sending}
        uploading={uploading}
        recording={recording}
        recordingTimer={recordingTimer}
        recordingWaveform={recordingWaveform}
        showEmojiPicker={showEmojiPicker}
        replyTo={replyTo}
        textareaRef={textareaRef}
        fileInputRef={fileInputRef}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSend={handleSend}
        onEmojiToggle={() => setShowEmojiPicker(!showEmojiPicker)}
        onFilePick={handleFilePick}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onCancelRecording={cancelRecording}
        onCancelReply={() => setReplyTo(null)}
        onEmojiSelect={(emoji) => { setInput((prev) => prev + emoji); setShowEmojiPicker(false); }}
      />

      <AnimatePresence>
        {expandedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 cursor-pointer"
            onClick={() => setExpandedImage(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full">
              <img src={expandedImage} alt="Expanded image" className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
    </div>
  );
}
