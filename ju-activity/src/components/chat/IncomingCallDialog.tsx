import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video, Mic } from "lucide-react";

interface IncomingCallDialogProps {
  callerName: string;
  callerAvatar?: string | null;
  isVideo: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallDialog({
  callerName,
  callerAvatar,
  isVideo,
  onAccept,
  onDecline,
}: IncomingCallDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onDecline}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-gradient-to-b from-card/95 to-card/80 border border-border/60 rounded-3xl shadow-2xl w-80 overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-8 pt-8 pb-6 text-center space-y-6">
          {/* Animated ring */}
          <div className="relative mx-auto w-fit">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
            />
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="relative rounded-full ring-2 ring-primary/30 ring-offset-4 ring-offset-background"
            >
              <Avatar className="h-20 w-20">
                <AvatarImage src={callerAvatar ?? ""} alt={callerName} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  {callerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>

          {/* Call info */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground/70 font-medium">
              Incoming {isVideo ? "video" : "voice"} call
            </p>
            <p className="text-xl font-bold tracking-tight">{callerName}</p>
          </div>

          {/* Call type indicator */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50">
            {isVideo ? (
              <><Video className="h-3.5 w-3.5" /> Video call</>
            ) : (
              <><Mic className="h-3.5 w-3.5" /> Voice call</>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full h-16 w-16 border-destructive/30 hover:bg-destructive/10 hover:border-destructive hover:text-destructive group transition-all duration-200"
              onClick={onDecline}
            >
              <PhoneOff className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Button>
            <Button
              variant="default"
              size="lg"
              className="rounded-full h-16 w-16 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 group transition-all duration-200"
              onClick={onAccept}
            >
              <Phone className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground/30">
            Press ESC or click backdrop to decline
          </p>
        </div>

        {/* Bottom accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </motion.div>
    </motion.div>
  );
}
