import { ArrowLeft, Phone, Video, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Member } from "@/types/chat";
import { UI } from "@/constants/ui";

interface ChatHeaderProps {
  title: string;
  members: Member[];
  total: number;
  showMembers: boolean;
  onBack: () => void;
  onToggleMembers: () => void;
}

export default function ChatHeader({
  title, members, total, showMembers, onBack, onToggleMembers,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 bg-card/60 backdrop-blur-xl px-3 sm:px-4 h-14 shrink-0 shadow-sm">
      <Button variant="ghost" size="icon" onClick={onBack}
        className="rounded-full hover:bg-accent/70 shrink-0 h-8 w-8 sm:h-9 sm:w-9 transition-colors">
        <ArrowLeft className="h-[18px] w-[18px]" />
      </Button>
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="relative shrink-0">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-background shadow-md">
            <AvatarFallback className="text-sm bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
              {(title || "A").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-sm truncate leading-tight text-foreground/90">{title || UI.CHAT.TITLE}</h2>
          <div className="flex items-center gap-1.5 mt-px">
            <span className="text-[11px] text-emerald-400/80 font-medium">{UI.CHAT.ONLINE}</span>
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
          onClick={onToggleMembers} title="Members">
          <Users className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
