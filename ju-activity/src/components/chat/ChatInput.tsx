import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Smile, Paperclip, Image, FileIcon, Mic, Send, Square, Undo2,
  Timer, X, Reply,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EMOJI_PICKER } from "@/constants/emojis";
import { ReplyTo } from "@/types/chat";

interface ChatInputProps {
  input: string;
  sending: boolean;
  uploading: boolean;
  recording: boolean;
  recordingTimer: number;
  recordingWaveform: number[];
  showEmojiPicker: boolean;
  replyTo: ReplyTo | null;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onEmojiToggle: () => void;
  onFilePick: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  onCancelReply: () => void;
  onEmojiSelect: (emoji: string) => void;
}

export default function ChatInput({
  input, sending, uploading, recording, recordingTimer, recordingWaveform,
  showEmojiPicker, replyTo, textareaRef, fileInputRef,
  onInputChange, onKeyDown, onSend, onEmojiToggle, onFilePick,
  onStartRecording, onStopRecording, onCancelRecording, onCancelReply, onEmojiSelect,
}: ChatInputProps) {
  return (
    <>
      {replyTo && (
        <div className="border-t border-border/40 bg-accent/30 px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Reply className="h-3 w-3 shrink-0" />
          <span className="font-medium shrink-0">Replying to {replyTo.senderName}</span>
          <span className="truncate flex-1">"{replyTo.content}"</span>
          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={onCancelReply}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="border-t border-border/40 bg-card/90 backdrop-blur-lg px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
            <div className="flex flex-wrap gap-1.5 justify-center max-h-40 overflow-y-auto">
              {EMOJI_PICKER.map((emoji) => (
                <button key={emoji} onClick={() => onEmojiSelect(emoji)}
                  className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-95">
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-border/50 bg-card/70 backdrop-blur-xl px-3 sm:px-4 py-2.5 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-end gap-1.5 max-w-4xl mx-auto">
          <input type="file" ref={fileInputRef} className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" />

          <Button variant="ghost" size="icon"
            className={`rounded-full h-9 w-9 shrink-0 transition-colors ${showEmojiPicker ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
            onClick={onEmojiToggle} title="Emoji">
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
              <DropdownMenuItem onClick={onFilePick} className="rounded-lg gap-2">
                <Image className="h-4 w-4" /> Photos & Videos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onFilePick} className="rounded-lg gap-2">
                <FileIcon className="h-4 w-4" /> Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onStartRecording} className="rounded-lg gap-2">
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
                onChange={onInputChange}
                onKeyDown={onKeyDown}
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
                onClick={onCancelRecording} title="Cancel recording">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button size="icon"
                className="rounded-full h-9 w-9 bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/30 transition-all"
                onClick={onStopRecording} title="Send recording">
                <Square className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="icon"
                className="rounded-full h-9 w-9 shrink-0 hover:bg-accent transition-colors"
                onClick={onStartRecording} disabled={uploading} title="Record voice">
                <Mic className="h-4.5 w-4.5 text-muted-foreground/70" />
              </Button>
              <Button size="icon"
                className="rounded-full h-9 w-9 shrink-0 bg-primary hover:bg-primary/90 shadow-md disabled:shadow-none transition-all active:scale-95"
                onClick={onSend} disabled={!input.trim() || sending || uploading}>
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
    </>
  );
}
