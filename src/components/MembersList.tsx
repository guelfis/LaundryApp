import React from 'react';
import { Plus } from "lucide-react";
import { MemberCard } from './MemberCard';
import { ApartmentMember } from '../lib/databaseTypes';
import { useTranslation } from "react-i18next";

interface MembersListProps {
  members: ApartmentMember[];
  currentUserId: string | null;
  onMemberClick: (userId: string) => void;
  onAddMemberClick: () => void;
  clickEnabled: boolean;
}

const getInitials = (fullName: string | null): string => {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const MembersList: React.FC<MembersListProps> = ({
  members,
  currentUserId,
  onMemberClick,
  onAddMemberClick,
  clickEnabled
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1 w-full">
      
      {/* WHATSAPP PATTERN: Interactive 'Add Member' row fixed at index 0 */}
      <MemberCard
        isClickable={clickEnabled} 
        onClick={onAddMemberClick}
        avatarBgClass={
          clickEnabled 
            ? "bg-blue-600 text-white" 
            : "bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 opacity-50"
        }
        avatarContent={<Plus className="w-5 h-5" />}
        title={
          <span className={clickEnabled ? "text-blue-600 dark:text-blue-400 font-bold" : "text-gray-400 cursor-not-allowed"}>
            {t('membersList.btn_add_member', 'Add member')}
          </span>
        }
        subtitle={t('membersList.subtitle_add_member', 'Invite a new resident via link')}
        subtitleClass="text-gray-400 dark:text-slate-500"
      />

      {/* RENDER LIST ENTRIES */}
      {members.map((member) => {
        const isSelf = member.user_id === currentUserId;
        const initials = getInitials(member.profiles.full_name);
        const isClickable = clickEnabled && !isSelf;

        return (
          <MemberCard
            key={member.user_id}
            isClickable={isClickable}
            onClick={() => onMemberClick(member.user_id)}
            avatarBgClass="bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-blue-300"
            avatarContent={initials}
            title={
              <>
                {member.profiles.full_name}{" "}
                {isSelf && (
                  <span className="text-xs text-blue-500 font-normal ml-0.5">
                    {t('membersList.label_self', '(You)')}
                  </span>
                )}
              </>
            }
            subtitle={
              member.role === 'admin' 
                ? t('membersList.role_admin', 'Apartment Admin') 
                : t('membersList.role_resident', 'Regular Resident')
            }
            subtitleClass={member.role === 'admin' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-500'}
          />
        );
      })}
    </div>
  );
};

export default MembersList;
