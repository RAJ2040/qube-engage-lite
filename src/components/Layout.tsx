import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { ProfileDropdown } from "./ProfileDropdown"
import { Outlet } from "react-router-dom"

interface LayoutProps {
  children?: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6">
            <SidebarTrigger />
            <div className="ml-auto">
              <ProfileDropdown />
            </div>
          </header>
          <main className="flex-1 p-6">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}