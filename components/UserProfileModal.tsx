import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  email: string;
  lastLogin: string;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  username,
  email,
  lastLogin,
}: UserProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>
            <strong>Username:</strong> {username}
          </p>
          <p>
            <strong>Email:</strong> {email}
          </p>
          <p>
            <strong>Last Login:</strong> {lastLogin}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
