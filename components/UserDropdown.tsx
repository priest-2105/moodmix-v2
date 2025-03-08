import React, { useState } from "react";
import Image from "next/image";

interface UserDropdownProps {
  profileImage: string;
  onProfile: () => void;
  onLogout: () => void;
}

export default function UserDropdown({ profileImage, onProfile, onLogout }: UserDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(prev => !prev)}>
        <Image
          src={profileImage}
          alt="Profile"
          width={40}
          height={40}
          className="rounded-full"
        />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg z-10">
          <ul>
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setOpen(false);
                onProfile();
              }}
            >
              Profile
            </li>
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              Logout
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
