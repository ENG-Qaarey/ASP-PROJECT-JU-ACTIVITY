import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Member } from "@/types/chat";

interface MembersPanelProps {
  show: boolean;
  members: Member[];
}

export default function MembersPanel({ show, members }: MembersPanelProps) {
  return (
    <AnimatePresence>
      {show && (
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
  );
}
