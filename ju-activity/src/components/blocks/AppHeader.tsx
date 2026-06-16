import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Settings,
  SunMedium,
  User,
} from "lucide-react";

interface AppHeaderProps {
  user: { name: string; avatar?: string | null; role: string } | null;
  unreadNotifications: number;
  isAdmin: boolean;
  isDarkMode: boolean;
  onMenuClick: () => void;
  onNavigate: (path: string) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onChatClick?: () => void;
  children?: React.ReactNode;
}

const AppHeader = ({
  user,
  unreadNotifications,
  isAdmin,
  isDarkMode,
  onMenuClick,
  onNavigate,
  onToggleTheme,
  onLogout,
  onChatClick,
  children,
}: AppHeaderProps) => {
  const unreadDisplay = unreadNotifications > 99 ? "99+" : unreadNotifications;

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center gap-3 px-3 lg:px-5 h-14">
        {/* Left: Menu + User Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            className="lg:hidden shrink-0 rounded-full hover:bg-accent"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-1 ring-border shrink-0">
              {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name ?? "User"} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary text-[11px] sm:text-xs font-semibold uppercase">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</span>
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">Online</span>
              </span>
            </div>
          </div>

          {children}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {user?.role && onChatClick && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open communications hub"
              className="relative rounded-full hover:bg-accent h-9 w-9"
              onClick={onChatClick}
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              {isAdmin && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-card" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate(`/${user?.role}/notifications`)}
            className="relative rounded-full hover:bg-accent h-9 w-9"
            aria-label={
              unreadNotifications > 0
                ? `You have ${unreadDisplay} unread notifications`
                : "Notifications"
            }
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 rounded-full bg-destructive text-destructive-foreground min-w-[18px] h-[18px] px-1 text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadDisplay}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full hover:bg-accent h-9 w-9 p-0"
              >
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-1 ring-border">
                  {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name ?? "User"} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-[11px] sm:text-xs font-semibold uppercase">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onNavigate(`/${user?.role}/profile`)}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate(`/${user?.role}/change-password`)}>
                <Settings className="w-4 h-4 mr-2" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggleTheme}>
                {isDarkMode ? (
                  <SunMedium className="w-4 h-4 mr-2" />
                ) : (
                  <Moon className="w-4 h-4 mr-2" />
                )}
                {isDarkMode ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
