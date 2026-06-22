import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { AppSidebar } from "@/components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
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
  Activity,
  Bell,
  Calendar,
  CheckSquare,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  Settings,
  Settings2,
  SunMedium,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NavMainItem } from "@/components/NavMain";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { UI } from "@/constants/ui";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface SecondaryNavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, users, logout } = useAuth();
  const { getUnreadNotificationsCount } = useActivity();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && theme === "dark";
  const unreadNotifications = getUnreadNotificationsCount();
  const unreadDisplay = unreadNotifications > 99 ? "99+" : unreadNotifications.toString();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  useEffect(() => setMounted(true), []);

  const getNavMain = (role: string): NavMainItem[] => {
    if (role === ROLES.ADMIN) {
      return [
        {
          title: "Dashboard",
          url: ROUTES.ADMIN.DASHBOARD,
          icon: LayoutDashboard,
          isActive: location.pathname === ROUTES.ADMIN.DASHBOARD,
        },
        {
          title: "Activities",
          url: ROUTES.ADMIN.ACTIVITIES,
          icon: Activity,
          isActive: location.pathname.startsWith("/admin/activities") || location.pathname.startsWith("/admin/create-activity") || location.pathname.startsWith("/admin/monitor"),
          items: [
            { title: "Create Activity", url: ROUTES.ADMIN.CREATE_ACTIVITY },
            { title: "View All", url: ROUTES.ADMIN.ACTIVITIES },
            { title: "View Activities", url: ROUTES.ADMIN.MONITOR_ACTIVITIES },
          ],
        },
        {
          title: "Users",
          url: ROUTES.ADMIN.USERS,
          icon: Users,
          isActive: location.pathname.startsWith("/admin/users") || location.pathname.startsWith("/admin/manage-users") || location.pathname.startsWith("/admin/manage-roles"),
          items: [
            { title: "Directory", url: ROUTES.ADMIN.USERS },
            { title: "Manage Users", url: ROUTES.ADMIN.MANAGE_USERS },
            { title: "Roles", url: ROUTES.ADMIN.MANAGE_ROLES },
          ],
        },
        {
          title: "Admin",
          url: ROUTES.ADMIN.APPLICATIONS,
          icon: Settings2,
          items: [
            { title: "Applications", url: ROUTES.ADMIN.APPLICATIONS },
            { title: "Reports", url: ROUTES.ADMIN.REPORTS },
            { title: "Audit Logs", url: ROUTES.ADMIN.LOGS },

          ],
        },
      ];
    }

    if (role === ROLES.COORDINATOR) {
      return [
        {
          title: "Dashboard",
          url: ROUTES.COORDINATOR.DASHBOARD,
          icon: LayoutDashboard,
          isActive: location.pathname === ROUTES.COORDINATOR.DASHBOARD,
        },
        {
          title: "Activities",
          url: ROUTES.COORDINATOR.ACTIVITIES,
          icon: ClipboardList,
          isActive: location.pathname.startsWith("/coordinator/activities"),
          items: [
            { title: "Manage", url: ROUTES.COORDINATOR.ACTIVITIES },
            { title: "Create", url: ROUTES.COORDINATOR.ACTIVITIES + "/new" },
          ],
        },
        {
          title: "Applications",
          url: ROUTES.COORDINATOR.APPLICATIONS,
          icon: FileText,
          isActive: location.pathname.startsWith("/coordinator/applications"),
        },
        {
          title: "Attendance",
          url: ROUTES.COORDINATOR.ATTENDANCE,
          icon: CheckSquare,
          isActive: location.pathname.startsWith("/coordinator/attendance"),
        },
      ];
    }

    return [
      {
        title: "Dashboard",
        url: ROUTES.STUDENT.DASHBOARD,
        icon: LayoutDashboard,
        isActive: location.pathname === ROUTES.STUDENT.DASHBOARD,
      },
      {
        title: "Activities",
        url: ROUTES.STUDENT.ACTIVITIES,
        icon: Calendar,
        isActive: location.pathname.startsWith("/student/activities"),
      },
      {
        title: "My Applications",
        url: ROUTES.STUDENT.APPLICATIONS,
        icon: FileText,
        isActive: location.pathname.startsWith("/student/applications"),
      },
    ];
  };

  const getNavSecondary = (role: string): SecondaryNavItem[] => {
    const paths = role === ROLES.ADMIN ? ROUTES.ADMIN : role === ROLES.COORDINATOR ? ROUTES.COORDINATOR : ROUTES.STUDENT;
    return [
      { name: "Chat", url: paths.CHAT, icon: MessageCircle },
      { name: "Notifications", url: paths.NOTIFICATIONS, icon: Bell },
      { name: "Calendar", url: paths.CALENDAR, icon: Calendar },
    ];
  };

  const role = user?.role ?? ROLES.STUDENT;
  const navMain = getNavMain(role);
  const navSecondary = getNavSecondary(role);

  const onNavigate = (path: string) => {
    if (path.startsWith("/")) navigate(path);
  };

  const toggleTheme = () => setTheme(isDarkMode ? "light" : "dark");

  return (
    <SidebarProvider className="h-[100dvh] max-h-[100dvh] overflow-hidden">
      <AppSidebar
        navMain={navMain}
        navSecondary={navSecondary}
        user={user ? { name: user.name, email: user.email ?? "", avatar: user.avatar } : { name: "User", email: "" }}
        onNavigate={onNavigate}
        onLogout={handleLogout}
      />
      <SidebarInset className="flex flex-col h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="w-7 h-7 ring-1 ring-border shrink-0">
              {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name ?? "User"} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold uppercase">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">{UI.CHAT.ONLINE}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const path = role === ROLES.ADMIN ? ROUTES.ADMIN.NOTIFICATIONS : role === ROLES.COORDINATOR ? ROUTES.COORDINATOR.NOTIFICATIONS : ROUTES.STUDENT.NOTIFICATIONS;
                onNavigate(path);
              }}
              className="relative rounded-full hover:bg-accent h-9 w-9"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 rounded-full bg-destructive text-destructive-foreground min-w-[18px] h-[18px] px-1 text-[10px] font-bold flex items-center justify-center">
                  {unreadDisplay}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full hover:bg-accent h-9 w-9 p-0">
                  <Avatar className="w-7 h-7 ring-1 ring-border">
                    {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name ?? "User"} /> : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold uppercase">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => {
                  const p = role === ROLES.ADMIN ? ROUTES.ADMIN.PROFILE : role === ROLES.COORDINATOR ? ROUTES.COORDINATOR.PROFILE : ROUTES.STUDENT.PROFILE;
                  onNavigate(p);
                }}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const p = role === ROLES.ADMIN ? ROUTES.ADMIN.CHANGE_PASSWORD : role === ROLES.COORDINATOR ? ROUTES.COORDINATOR.CHANGE_PASSWORD : ROUTES.STUDENT.CHANGE_PASSWORD;
                  onNavigate(p);
                }}>
                  <Settings className="w-4 h-4 mr-2" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={toggleTheme}>
                  {isDarkMode ? (
                    <SunMedium className="w-4 h-4 mr-2" />
                  ) : (
                    <Moon className="w-4 h-4 mr-2" />
                  )}
                  {isDarkMode ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {location.pathname.match(/\/chat/) ? (
          <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6">{children}</div>
          </main>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
