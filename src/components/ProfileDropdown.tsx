import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Settings, LogOut, Mail, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ProfileDropdown() {
  const [showProfile, setShowProfile] = useState(false)
  const { toast } = useToast()

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
    // In a real app, this would clear auth tokens and redirect
    console.log("Logout functionality would be implemented here")
  }

  const userData = {
    name: "John Doe",
    email: "john.doe@company.com",
    role: "Marketing Manager",
    department: "Growth Team",
    joinDate: "January 2023",
    lastLogin: "Today at 9:42 AM"
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center space-x-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{userData.name}</p>
              <p className="text-xs text-muted-foreground">{userData.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowProfile(true)}>
            <User className="mr-2 h-4 w-4" />
            View Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {userData.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{userData.name}</h3>
                <Badge variant="secondary">{userData.role}</Badge>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userData.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userData.department}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Joined:</span>
                  <span>{userData.joinDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Login:</span>
                  <span>{userData.lastLogin}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}