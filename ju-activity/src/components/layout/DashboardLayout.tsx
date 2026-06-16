import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import AppHeader from "@/components/blocks/AppHeader";
import CommunicationsHub from "@/components/chat/CommunicationsHub";
import SidebarNav from "@/components/layout/SidebarNav";
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  ClipboardList,
  FilePlus,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  Terminal,
  UserCog,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, users, logout } = useAuth();
  const { getUnreadNotificationsCount } = useActivity();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isDarkMode = mounted && theme === "dark";
  const unreadNotifications = getUnreadNotificationsCount();
  const unreadDisplay = unreadNotifications > 99 ? "99+" : unreadNotifications.toString();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => setMounted(true), []);

  const getNavItems = (role: string) => {
    const baseItems = [
      { icon: LayoutDashboard, label: "Dashboard", path: `/${role}/dashboard` },
    ];

    const roleItems: Record<string, typeof baseItems> = {
      student: [
        ...baseItems,
        { icon: Calendar, label: "Activities", path: "/student/activities" },
        { icon: FileText, label: "My Applications", path: "/student/applications" },
        { icon: MessageCircle, label: "Chat", path: "/student/chat" },
        { icon: Bell, label: "Notifications", path: "/student/notifications" },
      ],
      coordinator: [
        ...baseItems,
        { icon: ClipboardList, label: "Manage Activities", path: "/coordinator/activities" },
        { icon: FileText, label: "Applications", path: "/coordinator/applications" },
        { icon: MessageCircle, label: "Chat", path: "/coordinator/chat" },
        { icon: Bell, label: "Notifications", path: "/coordinator/notifications" },
        { icon: CheckSquare, label: "Attendance", path: "/coordinator/attendance" },
      ],
      admin: [
        ...baseItems,
        { icon: FilePlus, label: "Create Activity", path: "/admin/create-activity" },
        { icon: Calendar, label: "Admin Activities", path: "/admin/activities" },
        { icon: Activity, label: "Monitor Activities", path: "/admin/monitor-activities" },
        { icon: MessageCircle, label: "Chat", path: "/admin/chat" },
        { icon: Bell, label: "Notifications", path: "/admin/notifications" },
        { icon: Inbox, label: "Applications", path: "/admin/applications" },
        { icon: Users, label: "Directory", path: "/admin/users" },
        { icon: UserCog, label: "Manage Users", path: "/admin/manage-users" },
        { icon: BarChart3, label: "Advanced Reports", path: "/admin/reports-advanced" },
        { icon: Terminal, label: "Audit Logs", path: "/admin/logs" },
      ],
    };

    return roleItems[role] || baseItems;
  };

  const navItems = user ? getNavItems(user.role) : [];

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <div className={`${location.pathname.startsWith("/chat") ? "h-screen overflow-hidden" : "min-h-screen"} bg-background flex`}>
      <SidebarNav
        navItems={navItems}
        pathname={location.pathname}
        unreadNotifications={unreadNotifications}
        unreadDisplay={unreadDisplay}
        user={user ? { name: user.name, email: user.email ?? "", avatar: user.avatar } : null}
        onNavigate={(path) => navigate(path)}
      />

      <div className={`flex-1 lg:ml-64 ${location.pathname.startsWith("/chat") ? "flex flex-col min-h-0" : ""}`}>
        <AppHeader
          user={user}
          unreadNotifications={unreadNotifications}
          isAdmin={isAdmin}
          isDarkMode={mounted && isDarkMode}
          onMenuClick={() => setIsSidebarOpen(true)}
          onNavigate={(path) => navigate(path)}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
          onChatClick={() => setIsChatOpen(true)}
        />

        <CommunicationsHub
          open={isChatOpen}
          onOpenChange={setIsChatOpen}
          isAdmin={isAdmin}
          users={users ?? []}
          currentUserId={user?.id}
          isDarkMode={mounted && isDarkMode}
        />

        <main className={location.pathname.startsWith("/chat") ? "flex flex-1 min-h-0 overflow-hidden" : "p-4 lg:p-6"}>{children}</main>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card z-50 lg:hidden"
            >
              <SidebarNav
                navItems={navItems}
                pathname={location.pathname}
                unreadNotifications={unreadNotifications}
                unreadDisplay={unreadDisplay}
                user={user ? { name: user.name, email: user.email ?? "", avatar: user.avatar } : null}
                onNavigate={(path) => navigate(path)}
                onClose={() => setIsSidebarOpen(false)}
                headerHandle={user?.department
                  ? `${user.department.slice(0, 3).toUpperCase()}-${(user.name ?? "member").split(" ")[0]?.toLowerCase()}`
                  : user?.name ?? "ENG-jamiila"}
                headerStatusLabel="Online"
                portalLabel="JU Activity Hub"
                onLogout={handleLogout}
                mobile
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
