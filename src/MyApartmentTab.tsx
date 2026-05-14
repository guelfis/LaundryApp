import React, { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import SectionText from "./components/SectionText";
import EditSaveButton from "./components/EditSaveButton";
import { IconButton } from "./components/IconButton";
import MembersList from "./components/MembersList";
import useApartmentMembers from "./useApartments";
import InviteMemberModal from "./InviteMemberModal";
import { checkIsAdmin, getCleanStorageItem, resolveCurrentUserId } from "./auth/authUtils";

export default function MyApartmentTab() {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [apartmentName, setApartmentName] = React.useState(getCleanStorageItem('apartmentName') || 'my apartment');
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [tempName, setTempName] = useState(apartmentName);

    // Resolve user ID natively on mount
    useEffect(() => {
        resolveCurrentUserId().then(id => setCurrentUserId(id));
    }, []);

    // Invitation States
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    
    
    const apartmentId = useMemo(() => getCleanStorageItem('apartmentId') || '', []);
    const { data: members = [] } = useApartmentMembers(apartmentId);
    
    const isUserAdmin = useMemo(() => checkIsAdmin(members, currentUserId), [members, currentUserId]);
    
    const handleEditToggle = () => {
        if (isEditingName) {
            setApartmentName(tempName);
            localStorage.setItem('apartmentName', tempName);
        } else {
            setTempName(apartmentName);
        }
        setIsEditingName(!isEditingName);
    };


    const handlePromoteToAdmin = (userId: string) => {
        console.log(`Promote user ${userId} to admin`);
    };

    return (
        <>
        <div className="w-full px-4 py-2 flex flex-col gap-4 flex-1">
            {/* Apartment Name Section */}
            <SectionText title="Info" />
            <div className="flex items-center gap-3">
                <label className="text-lg font-bold text-gray-800 dark:text-gray-300 shrink-0 min-w-[70px] ml-8">
                    Name:
                </label>
                
                <div className="flex-1">
                    {isEditingName ? (
                        <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-400 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                            autoFocus
                        />
                    ) : (
                        <span className="text-gray-800 dark:text-gray-200 font-medium pl-3">{apartmentName}</span>
                    )}
                </div>

                <EditSaveButton 
                    isEditing={isEditingName}
                    onActionClick={handleEditToggle}
                    onCancelClick={() => {
                        setTempName(apartmentName);
                        setIsEditingName(false);
                    }}
                    labelType="apartment name"
                />
            </div>

            {/* Members Section Header */}
            <div className="flex items-center justify-between gap-3 mt-2">
                <SectionText title="Members" />
                <IconButton 
                    aria-label="Add member" 
                    onClick={() => setIsInviteModalOpen(true)} 
                    disabled={!isUserAdmin}
                    className={!isUserAdmin ? "opacity-40 cursor-not-allowed" : ""}
                >
                    <Plus className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                </IconButton>
            </div>

            {/* Injected Reusable Sub-list View */}
            <MembersList 
                members={members}
                currentUserId={currentUserId}
                isUserAdmin={isUserAdmin}
                onPromoteToAdmin={handlePromoteToAdmin}
            />
        </div>
        <InviteMemberModal 
            apartmentId={apartmentId} 
            apartmentName={apartmentName} 
            isModalOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
        />
        </>
    );
}
