import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  CheckCheck, Copy, Edit3, Trash2, Send, X, Reply,
  FileIcon, Play, MessageCircle, Smile,
} from "lucide-react";
import WaveformVisualizer from "./WaveformVisualizer";
import { ChatMessage, Member, ReplyTo } from "@/types/chat";
import { QUICK_REACTIONS, EMOJI_PICKER } from "@/constants/emojis";
import { formatTime } from "@/lib/format";
import { ROLES } from "@/constants/roles";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const parseTextWithLinks = (text: string) => {
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ type: "link", url: match[0], text: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
};

interface MessageBubbleProps {
  msg: ChatMessage;
  isMine: boolean;
  showAvatar: boolean;
  showSender: boolean;
  currentUserId: string;
  editingId: string | null;
  editInput: string;
  copiedId: string | null;
  members: Member[];
  replyTo: ReplyTo | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onCopy: (id: string, content: string) => void;
  onReply: (reply: ReplyTo) => void;
  onStartEdit: (id: string, content: string) => void;
  onCancelEdit: () => void;
  onSetEditInput: (val: string) => void;
  onExpandImage: (url: string) => void;
}

export default function MessageBubble({
  msg, isMine, showAvatar, showSender, currentUserId,
  editingId, editInput, copiedId, members, replyTo,
  onEdit, onDelete, onReact, onCopy, onReply,
  onStartEdit, onCancelEdit, onSetEditInput, onExpandImage,
}: MessageBubbleProps) {
  let metadata: Record<string, unknown> | null = null;
  try { if (msg.metadata) metadata = JSON.parse(msg.metadata); } catch { /* ignore */ }

  const senderMember = members.find((m) => m.id === msg.senderId);
  const isCoordinator = senderMember?.role === ROLES.COORDINATOR;
  const isAdminUser = senderMember?.role === ROLES.ADMIN;

  const parseReactions = (raw: string | null | undefined): { emoji: string; users: string[] }[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((r: Record<string, unknown>) => ({
        emoji: (r.emoji || r.Emoji || "") as string,
        users: (r.users || r.Users || []) as string[],
      }));
    } catch { return []; }
  };

  const reactions = parseReactions(msg.reactions);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const avatar = (
    <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background shadow-md">
      <AvatarImage src={msg.senderAvatar ?? undefined} />
      <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        {(msg.senderName || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  );

  let messageContentClass = "flex items-end ";
  if (msg.type === "image" || msg.type === "video") {
    messageContentClass += "flex-col";
  } else if (msg.type === "audio") {
    messageContentClass += "gap-0";
  } else {
    messageContentClass += "gap-2";
  }

  return (
    <motion.div
      key={msg.id}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-end gap-2 px-1 group ${isMine ? "flex-row-reverse" : ""} relative z-0 mb-3`}
    >
      {!isMine && showAvatar && avatar}
      {!isMine && !showAvatar && <div className="w-8 shrink-0" />}
      <div className={`flex flex-col gap-0.5 max-w-[78%] sm:max-w-[70%] ${isMine ? "items-end" : ""}`}>
        {!isMine && showSender && (
          <span className="text-[11px] font-medium text-muted-foreground/80 px-1 flex items-center gap-1.5">
            {msg.senderName || "Unknown"}
            {(isCoordinator || isAdminUser) && (
              <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                {isAdminUser ? "Admin" : "Coordinator"}
              </span>
            )}
          </span>
        )}
        <div className="relative">
          {msg.parent && (
            <div className={`mb-1 px-3 py-1.5 rounded-lg text-xs border-l-2 ${
              isMine ? "bg-primary-foreground/10 border-primary-foreground/30" : "bg-muted/50 border-muted-foreground/30"
            }`}>
              <p className="font-medium text-[11px] text-muted-foreground/70">{msg.parent.senderName}</p>
              <p className="truncate text-muted-foreground/60">{msg.parent.content}</p>
            </div>
          )}

          {editingId !== msg.id && (
            <div className={`absolute -top-8 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 ${
              isMine ? "left-0" : "right-0"
            }`}>
              <div className="flex items-center gap-0.5 rounded-full bg-background/90 backdrop-blur-md border border-border/40 shadow-lg px-1 py-0.5">
                <button onClick={() => { setShowReactionPicker(!showReactionPicker); }}
                  className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-accent transition-colors" title="React">
                  <Smile className="h-3 w-3" />
                </button>
                <button onClick={() => onCopy(msg.id, msg.content)}
                  className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-accent transition-colors" title="Copy">
                  {copiedId === msg.id ? <CheckCheck className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                </button>
                <button onClick={() => onReply({ id: msg.id, content: msg.content, senderName: msg.senderName })}
                  className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-accent transition-colors" title="Reply">
                  <Reply className="h-3 w-3" />
                </button>
                {isMine && msg.type === "text" && (
                  <button onClick={() => onStartEdit(msg.id, msg.content)}
                    className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-accent transition-colors" title="Edit">
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}
                {isMine && (
                  <button onClick={() => onDelete(msg.id)}
                    className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors" title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute -top-14 z-20"
              >
                <div className={`flex items-center gap-0.5 rounded-full bg-background/95 backdrop-blur-md border border-border/50 shadow-xl px-1 py-1 ${
                  isMine ? "left-0" : "right-0"
                }`}>
                  {QUICK_REACTIONS.slice(0, 5).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(msg.id, emoji);
                        setShowReactionPicker(false);
                      }}
                      className="h-7 w-7 rounded-full flex items-center justify-center text-lg hover:bg-accent hover:scale-110 transition-all active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`relative ${
            (msg.type === "image" || msg.type === "video") ? "px-0.5 py-0.5" : "px-3 py-1.5"
          } ${reactions.length > 0 ? "pb-4" : ""} text-sm break-words overflow-hidden ${
            isMine
              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-[10px] shadow-lg shadow-primary/20"
              : "bg-card border border-border/60 rounded-[10px] shadow-sm"
          }`}>
            {editingId === msg.id ? (
              <div className="px-3 py-1.5 flex gap-2">
                <input
                  value={editInput}
                  onChange={(e) => onSetEditInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEdit(msg.id); } }}
                  className="flex-1 bg-transparent border-b border-current outline-none text-sm"
                  autoFocus
                />
                <Button size="icon" className="h-7 w-7 rounded-full shrink-0" onClick={() => onEdit(msg.id)}>
                  <Send className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full shrink-0" onClick={onCancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className={messageContentClass}>
                <div className="flex-1">
                  {msg.type === "image" && metadata?.url && (
                    <div className="relative">
                      <img src={metadata.url as string} alt={msg.content}
                        className="w-full rounded-[10px] cursor-pointer hover:opacity-90 max-h-[300px] object-cover transition-opacity"
                        onClick={() => onExpandImage(metadata.url as string)} />
                    </div>
                  )}
                  {msg.type === "video" && metadata?.url && (
                    <div className="relative">
                      <video src={metadata.url as string} controls className="w-full rounded-[10px] max-h-[300px] object-cover" preload="metadata" />
                    </div>
                  )}
                  {msg.type === "audio" && metadata?.url && (
                    <div className="relative">
                      <WaveformVisualizer audioUrl={metadata.url as string} isMine={isMine} />
                    </div>
                  )}
                  {msg.type === "file" && metadata?.url && (
                    <a href={metadata.url as string} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2.5 text-sm rounded-lg p-2 ${
                        isMine ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-muted/50 hover:bg-muted"
                      } transition-colors`}>
                      <div className={`rounded-lg p-1.5 ${isMine ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
                        <FileIcon className={`h-4 w-4 ${isMine ? "text-primary-foreground" : "text-primary"}`} />
                      </div>
                      <span className="underline-offset-2 underline truncate flex-1 min-w-0">{(metadata.fileName as string) || msg.content}</span>
                    </a>
                  )}
                  {msg.type === "text" && (
                    <span className="leading-relaxed whitespace-pre-wrap break-all overflow-wrap-anywhere">
                      {parseTextWithLinks(msg.content).map((part, idx) => {
                        if (typeof part === "string") {
                          return <span key={idx}>{part}</span>;
                        } else {
                          return (
                            <a
                              key={idx}
                              href={part.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`underline hover:opacity-80 transition-opacity break-all overflow-wrap-anywhere ${
                                isMine ? "text-primary-foreground" : "text-primary"
                              }`}
                            >
                              {part.text}
                            </a>
                          );
                        }
                      })}
                    </span>
                  )}
                </div>

                  <div className="flex flex-col items-end gap-1">
                  {editingId !== msg.id && (
                    <div className={`flex items-center gap-1 ${(msg.type === "image" || msg.type === "video") ? "absolute bottom-2 right-2" : ""}`}>
                      <div className={`flex items-center gap-0.5 ${(msg.type === "image" || msg.type === "video") ? "rounded-full bg-black/40 backdrop-blur-sm px-1 py-0" : ""}`}>
                        <span className={`text-[10px] inline-flex items-center font-medium ${
                          isMine ? "text-primary-foreground/85" : "text-black/80 dark:text-white/80"
                        } ${(msg.type === "image" || msg.type === "video") ? "text-white" : ""}`}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {msg.editedAt && (
                          <span className={`text-[9px] italic ${
                            isMine ? "text-primary-foreground/60" : "text-black/60 dark:text-white/60"
                          } ${(msg.type === "image" || msg.type === "video") ? "text-white/80" : ""}`}>
                            edited
                          </span>
                        )}
                        {isMine && <CheckCheck className={`h-3 w-3 ${(msg.type === "image" || msg.type === "video") ? "text-white" : "text-blue-300"}`} />}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {editingId !== msg.id && reactions.length > 0 && (
            <div className={`absolute ${isMine ? "bottom-0 right-1 translate-y-1/2" : "bottom-0 left-1 translate-y-1/2"} z-[100]`}>
              <button
                onClick={() => onReact(msg.id, reactions[0].emoji)}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs border bg-background/95 border-border/50 shadow-md hover:border-border/80 transition-colors"
              >
                {reactions.map((r, i) => (
                  <span key={i} className="text-base -mr-1 last:mr-0">{r.emoji}</span>
                ))}
                <span className="text-[10px] text-muted-foreground font-medium ml-1">
                  {reactions.reduce((sum, r) => sum + r.users.length, 0)}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
      {isMine && avatar}
    </motion.div>
  );
}
