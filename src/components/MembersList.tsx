import React from 'react';
import { ShieldAlert, UserPlus } from "lucide-react";
import { IconButton } from "./IconButton";

interface Profile {
  id: string;
  full_name: string | null;
}

interface ApartmentMember {
  user_id: string;
  role: string;
  profiles: Profile;
}

interface MembersListProps {
  members: ApartmentMember[];
  currentUserId: string | null;
  isUserAdmin: boolean;
  onPromoteToAdmin: (userId: string) => void;
}

// Helper function to extract up to two initials from a full name string cleanly
const getInitials = (fullName: string | null): string => {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const MembersList: React.FC<MembersListProps> = ({
  members,
  currentUserId,
  isUserAdmin,
  onPromoteToAdmin
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {members.map((member) => {
        const isSelf = member.user_id === currentUserId;
        const initials = getInitials(member.profiles.full_name);

        return (
          <div 
            key={member.user_id} 
            className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-800 last:border-b-0 min-h-[64px]"
          >
            {/* Left Box: Avatar aligned cleanly on a centralized cross-axis with text */}
            <div className="flex items-center gap-4">
              {/* Visual Initials Avatar Layout Box */}
              <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm tracking-wider shrink-0 select-none">
                {initials}
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-base font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                  {member.profiles.full_name}{" "}
                  {isSelf && (
                    <span className="text-xs text-blue-500 font-normal ml-0.5">(You)</span>
                  )}
                </span>
                
                <span className={`text-xs font-medium mt-0.5 ${
                  member.role === 'admin' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-500'
                }`}>
                  {member.role === 'admin' ? 'Apartment Admin' : 'Regular Resident'}
                </span>
              </div>
            </div>

            {/* Right Box: Operations Actions alignment */}
            <div className="flex items-center gap-2 shrink-0">
              {isUserAdmin && member.role !== 'admin' && (
                <IconButton 
                  size="compact" 
                  onClick={() => onPromoteToAdmin(member.user_id)}
                  aria-label={`Promote ${member.profiles.full_name || 'user'} to Admin`}
                  title="Make Admin"
                >
                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </IconButton>
              )}

              {member.role === 'admin' && (
                <div className="p-1.5 text-amber-500 dark:text-amber-400 flex items-center justify-center" title="Administrator Privileges Locked">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default MembersList;
