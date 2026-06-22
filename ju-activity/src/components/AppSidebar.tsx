import { GalleryVerticalEnd, type LucideIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "@/components/TeamSwitcher"
import { NavMain, type NavMainItem } from "@/components/NavMain"
import { NavSecondary } from "@/components/NavSecondary"
import { NavUser } from "@/components/NavUser"
import { UI } from "@/constants/ui"

interface NavSecondaryItem {
  name: string
  url: string
  icon: LucideIcon
}

interface AppSidebarProps {
  navMain: NavMainItem[]
  navSecondary: NavSecondaryItem[]
  user: { name: string; email: string; avatar?: string | null }
  onNavigate: (path: string) => void
  onLogout?: () => void
}

export function AppSidebar({ navMain, navSecondary, user, onNavigate, onLogout }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher
          teams={[
            { name: UI.APP_NAME, label: UI.APP_LABEL, icon: GalleryVerticalEnd },
          ]}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} onNavigate={onNavigate} />
        <NavSecondary items={navSecondary} label={UI.NAV.MORE} onNavigate={onNavigate} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={user}
          onLogout={onLogout}
          onNavigate={onNavigate}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
