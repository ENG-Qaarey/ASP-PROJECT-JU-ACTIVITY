import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  CheckCheck, Copy, Edit3, Trash2, Send, X, Reply,
  FileIcon, Play, MessageCircle,
} from "lucide-react";
import WaveformVisualizer from "./WaveformVisualizer";
import { ChatMessage, Member, ReplyTo } from "@/types/chat";
import { QUICK_REACTIONS } from "@/constants/emojis";
import { formatTime } from "@/lib/format";

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
  const isCoordinator = senderMember?.role === "coordinator";
  const isAdminUser = senderMember?.role === "admin";

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
                <button onClick={() => onCopy(msg.id, msg.content)}
                  className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-accent transition-colors" title="Copy">
                  {copiedId === msg.id ? <CheckCheck className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                </button>
                {isMine && (
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

          <div className={`px-4 py-2.5 text-sm break-words overflow-hidden ${
            isMine
              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl rounded-br-sm shadow-lg shadow-primary/20"
              : "bg-card border border-border/60 rounded-2xl rounded-bl-sm shadow-sm"
          }`}>
            {editingId === msg.id ? (
              <div className="flex gap-2">
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
              <>
                {msg.type === "image" && metadata?.url && (
                  <div className="-mx-1 -mt-1 mb-1.5">
                    <img src={metadata.url as string} alt={msg.content}
                      className="max-w-full rounded-xl cursor-pointer hover:opacity-90 max-h-64 object-cover transition-opacity"
                      onClick={() => onExpandImage(metadata.url as string)} />
                  </div>
                )}
                {msg.type === "video" && metadata?.url && (
                  <div className="-mx-1 -mt-1 mb-1.5">
                    <video src={metadata.url as string} controls className="max-w-full rounded-xl max-h-64" preload="metadata" />
                  </div>
                )}
                {msg.type === "audio" && metadata?.url && (
                  <div className="-mx-1">
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
                {msg.type === "text" && <span className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</span>}
              </>
            )}

            {editingId !== msg.id && reactions.length > 0 && (
              <div className={`flex flex-wrap gap-1 mt-1.5 ${isMine ? "justify-end" : "justify-start"}`}>
                {reactions.map((r) => (
                  <button key={r.emoji}
                    onClick={() => onReact(msg.id, r.emoji)}
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

          {editingId !== msg.id && (
            <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "flex-row-reverse" : ""}`}>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="flex items-center gap-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/30 shadow-sm px-1 py-0.5">
                  {QUICK_REACTIONS.slice(0, 4).map((emoji) => (
                    <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                      className="h-5 w-5 rounded-full flex items-center justify-center text-xs hover:bg-accent hover:scale-110 transition-all">
                      {emoji}
                    </button>
                  ))}
                  <div className="w-px h-3 bg-border/40 mx-0.5" />
                  <button onClick={() => onReply({ id: msg.id, content: msg.content, senderName: msg.senderName })}
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
}
