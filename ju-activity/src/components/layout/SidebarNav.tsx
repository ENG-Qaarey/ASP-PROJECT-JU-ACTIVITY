import { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface SidebarNavProps {
  navItems: NavItem[];
  pathname: string;
  unreadNotifications: number;
  unreadDisplay: string;
  user: { name: string; email: string; avatar?: string | null } | null;
  onNavigate: (path: string) => void;
  onClose?: () => void;
  headerHandle?: string;
  headerStatusLabel?: string;
  portalLabel?: string;
  onLogout?: () => void;
  /** Render as mobile variant (includes close button, logout) */
  mobile?: boolean;
}

export default function SidebarNav({
  navItems, pathname, unreadNotifications, unreadDisplay,
  user, onNavigate, onClose, headerHandle, headerStatusLabel,
  portalLabel = "JU Activity Hub", onLogout, mobile = false,
}: SidebarNavProps) {
  return (
    <aside className={`${mobile ? "" : "hidden lg:flex w-64"} bg-card border-r border-border flex-col ${mobile ? "h-full" : "fixed h-full"}`}>
      {mobile ? (
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{portalLabel}</p>
            <p className="text-base font-semibold text-foreground">{headerHandle || user?.name || ""}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              {headerStatusLabel || "Online"}
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <div className="flex items-center justify-center">
            <h1 className="text-3xl font-extrabold">
              <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                JU-AMS
              </span>
            </h1>
          </div>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                onNavigate(item.path);
                if (mobile && onClose) onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
              {item.label === "Notifications" && unreadNotifications > 0 && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${
                    isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                  }`}
                >
                  {unreadDisplay}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {!mobile && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Avatar className="w-10 h-10 shrink-0">
              {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name ?? "User"} /> : null}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      {mobile && onLogout && (
        <div className="p-4 border-t border-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
