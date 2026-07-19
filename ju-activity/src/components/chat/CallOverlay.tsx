import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, Hand,
  MessageSquareText, Users, MoreVertical, Maximize2, X,
} from "lucide-react";

interface CallOverlayProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  duration: number;
  callerName: string;
  callerAvatar?: string | null;
  isCaller: boolean;
  callError?: string | null;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export default function CallOverlay({
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  duration,
  callerName,
  callerAvatar,
  isCaller,
  callError,
  onToggleMute,
  onToggleVideo,
  onEndCall,
}: CallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState<"participants" | "notes">("participants");

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const isConnected = !!remoteStream;
  const btnBase = "rounded-full h-11 w-11 border-0 transition-all duration-200 flex-shrink-0";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative bg-gradient-to-b from-card/95 to-card/70 border border-border/60 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl max-h-[95vh] max-w-[96vw] ${
            showSidePanel ? "w-[900px]" : "w-[640px]"
          }`}
        >
          {/* ===== Top Bar ===== */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-black/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isConnected ? "bg-emerald-500" : callError ? "bg-destructive" : "bg-amber-500 animate-pulse"
                }`} />
                <span className="text-sm font-semibold truncate">{callerName}</span>
              </div>
              <div className="h-3 w-px bg-border/40 flex-shrink-0" />
              <span className="text-xs text-muted-foreground font-mono tabular-nums tracking-wider flex-shrink-0">
                {formatDuration(duration)}
              </span>
              {!isConnected && !callError && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-amber-500 border-amber-500/30 bg-amber-500/10 font-medium flex-shrink-0">
                  Connecting
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <div className="flex items-center gap-1.5 mr-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground/50 font-medium tracking-wider">REC</span>
                </div>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground/60 hover:text-foreground">
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* ===== Error Banner ===== */}
          {callError && (
            <div className="px-5 py-2 bg-destructive/10 border-b border-destructive/20 text-center">
              <span className="text-xs font-medium text-destructive">{callError}</span>
            </div>
          )}

          {/* ===== Body ===== */}
          <div className={`flex ${showSidePanel ? "h-[440px]" : "h-[380px]"}`}>
            {/* Video stage */}
            <div className={`relative flex-shrink-0 bg-black/40 ${showSidePanel ? "w-[480px]" : "flex-1"} transition-[width] duration-300`}>
              {isConnected && !isVideoOff ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-4">
                  <div className="relative">
                    {isConnected && (
                      <motion.div
                        animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.1, 0.25] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-primary/10 blur-2xl"
                      />
                    )}
                    <Avatar className="h-24 w-24 ring-2 ring-border/30 shadow-xl">
                      <AvatarImage src={callerAvatar ?? ""} alt={callerName} />
                      <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                        {callerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white/90">{callerName}</p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {isConnected ? "On the call" : "Connecting..."}
                    </p>
                  </div>
                  {isConnected && (
                    <div className="flex items-end gap-0.5 h-4">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 10 + Math.random() * 14, 4] }}
                          transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5, delay: i * 0.12 }}
                          className="w-1 bg-emerald-400/60 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Self-view PIP */}
              <div className="absolute bottom-3 right-3 w-28 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl shadow-black/30 bg-black/60">
                {localStream && !isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm bg-muted/50 text-muted-foreground">
                        Y
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5">
                  <span className="text-[10px] text-white/80 font-medium">You</span>
                </div>
                {isMuted && (
                  <div className="absolute top-1.5 right-1.5 bg-destructive/80 backdrop-blur-sm rounded-full p-0.5">
                    <MicOff className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Raise hand toast */}
              <AnimatePresence>
                {handRaised && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg"
                  >
                    <Hand className="h-3.5 w-3.5 text-white" />
                    <span className="text-[11px] text-white font-semibold">Hand raised</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ===== Side Panel ===== */}
            <AnimatePresence>
              {showSidePanel && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="border-l border-border/40 bg-black/5 overflow-hidden flex-shrink-0"
                >
                  <div className="w-[280px] h-full flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
                      <span className="text-xs font-semibold text-muted-foreground/80">
                        {sidePanelTab === "participants" ? "Participants" : "Live notes"}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setShowSidePanel(false)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex border-b border-border/30">
                      <button
                        onClick={() => setSidePanelTab("participants")}
                        className={`flex-1 py-2 text-xs font-medium transition-colors relative ${
                          sidePanelTab === "participants"
                            ? "text-foreground"
                            : "text-muted-foreground/50 hover:text-muted-foreground"
                        }`}
                      >
                        Participants
                        {sidePanelTab === "participants" && (
                          <motion.div layoutId="panel-tab" className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
                        )}
                      </button>
                      <button
                        onClick={() => setSidePanelTab("notes")}
                        className={`flex-1 py-2 text-xs font-medium transition-colors relative ${
                          sidePanelTab === "notes"
                            ? "text-foreground"
                            : "text-muted-foreground/50 hover:text-muted-foreground"
                        }`}
                      >
                        Live notes
                        {sidePanelTab === "notes" && (
                          <motion.div layoutId="panel-tab" className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
                        )}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {sidePanelTab === "participants" ? (
                        <>
                          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-primary/5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                Y
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">You</p>
                              <p className="text-[10px] text-muted-foreground/50">{isCaller ? "Host" : "Participant"} · You</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-emerald-500/30 text-emerald-500 font-medium flex-shrink-0">
                              Speaking
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={callerAvatar ?? ""} alt={callerName} />
                              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                {callerName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{callerName}</p>
                              <p className="text-[10px] text-muted-foreground/50">
                                {isCaller ? "Participant" : "Host"}
                              </p>
                            </div>
                            {!isConnected && (
                              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <MessageSquareText className="h-8 w-8 mx-auto text-muted-foreground/15 mb-2" />
                          <p className="text-xs text-muted-foreground/40">No notes yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ===== Control Bar ===== */}
          <div className="flex items-center justify-center gap-2.5 px-4 py-3.5 border-t border-border/40 bg-black/10 overflow-x-auto">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                className={`${btnBase} ${
                  isMuted
                    ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted/40"
                }`}
                onClick={onToggleMute}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                className={`${btnBase} ${
                  isVideoOff
                    ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted/40"
                }`}
                onClick={onToggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                className={`${btnBase} text-foreground/50 hover:text-foreground hover:bg-muted/40`}
              >
                <MonitorUp className="h-5 w-5" />
              </Button>
            </div>

            <div className="h-8 w-px bg-border/30 mx-1 flex-shrink-0" />

            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                className={`${btnBase} ${
                  handRaised
                    ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
                    : "text-foreground/50 hover:text-foreground hover:bg-muted/40"
                }`}
                onClick={() => setHandRaised((p) => !p)}
              >
                <Hand className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                className={`${btnBase} ${
                  showSidePanel && sidePanelTab === "participants"
                    ? "bg-primary/15 text-primary hover:bg-primary/25"
                    : "text-foreground/50 hover:text-foreground hover:bg-muted/40"
                }`}
                onClick={() => {
                  setSidePanelTab("participants");
                  setShowSidePanel((p) => !p);
                }}
              >
                <Users className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                className={`${btnBase} ${
                  showSidePanel && sidePanelTab === "notes"
                    ? "bg-primary/15 text-primary hover:bg-primary/25"
                    : "text-foreground/50 hover:text-foreground hover:bg-muted/40"
                }`}
                onClick={() => {
                  setSidePanelTab("notes");
                  setShowSidePanel((p) => !p);
                }}
              >
                <MessageSquareText className="h-5 w-5" />
              </Button>
            </div>

            <div className="h-8 w-px bg-border/30 mx-1 flex-shrink-0" />

            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                className={`${btnBase} text-foreground/50 hover:text-foreground hover:bg-muted/40`}
              >
                <MoreVertical className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                className="rounded-full h-11 w-11 bg-destructive/90 hover:bg-destructive text-white shadow-lg shadow-destructive/25 hover:shadow-destructive/40 transition-all duration-200 flex-shrink-0 border-0"
                onClick={() => setShowConfirmEnd(true)}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ===== End Call Confirmation ===== */}
      <AnimatePresence>
        {showConfirmEnd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowConfirmEnd(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card border border-border/60 rounded-2xl shadow-2xl p-6 w-72 backdrop-blur-xl text-center space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <PhoneOff className="w-6 h-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold">End call?</p>
                <p className="text-xs text-muted-foreground/70">
                  This will disconnect you from the call.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-10"
                  onClick={() => setShowConfirmEnd(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl h-10"
                  onClick={() => {
                    setShowConfirmEnd(false);
                    onEndCall();
                  }}
                >
                  End call
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
