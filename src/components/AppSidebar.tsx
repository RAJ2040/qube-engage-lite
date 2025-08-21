import { NavLink, useLocation } from "react-router-dom"
import {
  BarChart3,
  Calendar,
  GitBranch,
  Home,
  MessageSquare,
  Radio,
  Settings,
  Users,
  Zap
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Events", url: "/events", icon: Zap },
  { title: "Segments", url: "/segments", icon: Users },
  { title: "Campaigns", url: "/campaigns", icon: MessageSquare },
  { title: "Journeys", url: "/journeys", icon: GitBranch },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
]

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  const collapsed = state === "collapsed"

  return (
    <Sidebar className={cn(
      "transition-all duration-300 ease-in-out border-r border-border",
      collapsed ? "w-16" : "w-64"
    )}>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <img src="/favicon.ico" alt="QubeEngage Logo" className="w-8 h-8 rounded-lg" />
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gradient-primary">QubeEngage</h1>
              <p className="text-xs text-muted-foreground">Marketing Automation</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "mb-2",
            collapsed && "sr-only"
          )}>
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover-lift",
                        isActive(item.url)
                          ? "bg-gradient-primary text-white shadow-glow"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover-lift",
                        isActive(item.url)
                          ? "bg-gradient-primary text-white shadow-glow"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}