import React, { useContext, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import SectionText from "../components/SectionText";
import { IconButton } from "../components/IconButton";
import MembersList from "../components/MembersList";
import {useApartmentMembers} from "../useApartments";
import InviteMemberModal from "../myApartment/InviteMemberModal";
import { checkIsAdmin, getCleanStorageItem, resolveCurrentUserId } from "../auth/authUtils";
import PendingRequestsSection from "../myApartment/PendingRequestsSection";
import ApartmentNameEditableSection from "../utils/ApartmentNameEditableSection";
import { BookingContext } from "../contexts/BookingContext";

export default function MyApartmentTab() {

    const { householdId } = useContext(BookingContext)!;
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [apartmentName, setApartmentName] = React.useState(getCleanStorageItem('apartmentName') || 'my apartment');
    const [isEditingName, setIsEditingName] = useState<boolean>(false)
    // Resolve user ID natively on mount
    useEffect(() => {
        resolveCurrentUserId().then(id => setCurrentUserId(id));
    }, []);

    // Invitation States
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    
    
    const apartmentId = useMemo(() => getCleanStorageItem('apartmentId') || '', []);
    const { data: members = [] } = useApartmentMembers(apartmentId);
    
    const isUserAdmin = useMemo(() => checkIsAdmin(members, currentUserId), [members, currentUserId]);


    const handlePromoteToAdmin = (userId: string) => {
        console.log(`Promote user ${userId} to admin`);
    };

    return (
        <>
        <div className="w-full px-4 py-2 flex flex-col gap-4 flex-1">
            {/* Apartment Name Section */}
            <SectionText title="Info" />
            <ApartmentNameEditableSection
                apartmentName={apartmentName}
                onNameChange={
                    (newName) => {
                        setApartmentName(newName);
                        localStorage.setItem('apartmentName', newName);
                    }
                }
                isEditing={isEditingName}
                setIsEditing={setIsEditingName}
                householdId={householdId}
            />
            {/* Conditionally render pending requests only for admins */}
            {isUserAdmin && (
                <PendingRequestsSection apartmentId={apartmentId} />
            )}


            {/* Members Section Header */}
            <div className="flex items-center justify-between gap-3 mt-2">
                <SectionText title={`Members (${members.length})`} />
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
