"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"
import type { SpotifyUser } from "@/types/spotify"

interface UserProfileButtonProps {
  user: SpotifyUser | null
  onLogout: () => void
}

export default function UserProfileButton({ user, onLogout }: UserProfileButtonProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false)

  if (!user) return null

  const userImage = user.images && user.images.length > 0 ? user.images[0].url : null

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 w-10 rounded-full p-0 overflow-hidden hover:bg-white/10">
            {userImage ? (
              <img
                src={userImage || "/placeholder.svg"}
                alt={user.display_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-[#282828] text-white border-[#333]">
          <DropdownMenuItem className="cursor-pointer hover:bg-white/10" onClick={() => setIsProfileModalOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem
            className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-white/10"
            onClick={() => setIsLogoutAlertOpen(true)}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="bg-[#282828] text-white border-[#333]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">User Profile</DialogTitle>
            <DialogDescription className="text-white/70">Your Spotify account information</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-4">
              {userImage ? (
                <img src={userImage || "/placeholder.svg"} alt={user.display_name} className="h-20 w-20 rounded-full" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-[#333] flex items-center justify-center">
                  <User className="h-10 w-10 text-white/70" />
                </div>
              )}

              <div className="flex flex-col">
                <h3 className="text-xl font-bold">{user.display_name}</h3>
                <p className="text-white/70">{user.email}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="font-medium">User ID</span>
                <span className="text-white/70">{user.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="font-medium">Country</span>
                <span className="text-white/70">{user.country || "Not available"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="font-medium">Product</span>
                <span className="text-white/70 capitalize">{user.product || "Not available"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">Last Login</span>
                <span className="text-white/70">Just now</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
              onClick={() => setIsProfileModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation */}
      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent className="bg-[#282828] text-white border-[#333]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              You'll need to log in again to access your playlists and create mood-based collections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent text-white border-white/20 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600" onClick={onLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

