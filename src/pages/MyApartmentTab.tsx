import React, { useContext, useEffect, useMemo, useState } from "react";
import SectionText from "../components/SectionText";
import MembersList from "../components/MembersList";
import {useApartmentMembers, useDeleteOrLeaveApartment} from "../useApartments";
import InviteMemberModal from "../myApartment/InviteMemberModal";
import { checkIsAdmin, getCleanStorageItem, resolveCurrentUserId } from "../auth/authUtils";
import PendingRequestsSection from "../myApartment/PendingRequestsSection";
import ApartmentNameEditableSection from "../utils/ApartmentNameEditableSection";
import { BookingContext } from "../contexts/BookingContext";
import { LogOut, Trash2 } from "lucide-react";
import MemberModal from "../myApartment/MemberModal";
import { ApartmentMember } from "../lib/databaseTypes";
import { useNavigate } from "react-router-dom";

const destructiveButtonStyle = "flex items-center justify-center gap-2 py-3 px-6 text-red-600 dark:text-red-400 text-base bg-transparent border-none rounded-xl active:bg-red-50 dark:active:bg-red-950/20 active:scale-[0.98] transition-all disabled:opacity-40";

export default function MyApartmentTab() {

    const navigate = useNavigate();

    const { householdId } = useContext(BookingContext)!;
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [apartmentName, setApartmentName] = React.useState(getCleanStorageItem('apartmentName') || 'my apartment');
    const [isEditingName, setIsEditingName] = useState<boolean>(false)
    const [selectedUserId, setSelectedUserId] =  useState<string | null>(null);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);

    // Resolve user ID natively on mount
    useEffect(() => {
        resolveCurrentUserId().then(id => setCurrentUserId(id));
    }, []);

    // Invitation States
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    
    
    const apartmentId = useMemo(() => getCleanStorageItem('apartmentId') || '', []);
    const { data: members = [] } = useApartmentMembers(apartmentId);
    const { leaveApartment, isLeaving, deleteApartment, isDeletingApartment } = useDeleteOrLeaveApartment();


    const isUserAdmin = useMemo(() => checkIsAdmin(members, currentUserId), [members, currentUserId]);
    const canDeleteApartment = isUserAdmin && members.length === 1;
    const membersMap = useMemo((): Record<string, ApartmentMember> => {
        return Object.fromEntries(members.map(m => [m.user_id, m]));
        }, [members]);
    

    const handleDeleteApartment = async () => {
        const confirmFirst = window.confirm("WARNING: This action is permanent! Are you sure you want to completely delete this apartment and all its booking logs?");
        if (confirmFirst) {
            try {
                await deleteApartment(apartmentId);
                alert("Apartment successfully deleted.");
                navigate('/apartment-login', { replace: true }); 
            } catch (err) {
                const errorInstance = err as Error;
                console.error("Failed to Delete the apartment", err);
                alert(`Could not delete the apartment: ${errorInstance.message}`);
            }
        }
    };

    const handleLeaveApartment = async () => {
        if (window.confirm("Are you sure you want to leave this apartment?")) {
            try {
                await leaveApartment(apartmentId);
                navigate('/apartment-login', { replace: true });
            } catch (err) {
                const errorInstance = err as Error;
                console.error("Failed to Leave the apartment", err);
                alert(`Could not leave the apartment: ${errorInstance.message}`);
            }
        }
    };

    const handleCloseMemberModal = () => {
        setIsMemberModalOpen(false);
        setSelectedUserId(null); 
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
                <SectionText title={`Members (${members.length})`} />
                    
                {/* Sub-list View */}
                <MembersList 
                    members={members}
                    currentUserId={currentUserId}
                    clickEnabled={isUserAdmin}
                    onMemberClick={(userId:string)=>{
                        setIsMemberModalOpen(true);
                        setSelectedUserId(userId);
                    }}
                    onAddMemberClick={
                        () => setIsInviteModalOpen(true)
                    }
                />

                <SectionText title={`More actions`} />
                {/* CRITICAL ACTIONS FOOTER BARS */}
                <div className="pt-6 pb-2 mt-auto flex w-full">
                    {canDeleteApartment ? (
                        <button
                            aria-label="promote"
                            onClick={handleDeleteApartment}
                            disabled={isDeletingApartment}
                            className={destructiveButtonStyle}
                            >
                            <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                            <span>{isDeletingApartment ? "Deleting..." : "Delete Apartment"}</span>
                        </button>
                    ) : (
                        /* DISCRETE TEXT-ONLY LEAVE ACTION */
                        <button
                            aria-label="leave"
                            onClick={handleLeaveApartment}
                            disabled={isLeaving}
                            className={destructiveButtonStyle}
                        >
                            <LogOut size={18} className="text-red-600 dark:text-red-400" />
                            <span>{isLeaving ? "Leaving..." : "Leave Apartment"}</span>
                        </button>
                    )}
                </div>


            </div>
            <InviteMemberModal 
                apartmentId={apartmentId} 
                apartmentName={apartmentName} 
                isModalOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            />
            <MemberModal
                member={membersMap[selectedUserId ?? '']}
                apartmentId={apartmentId}
                isModalOpen={isMemberModalOpen}
                onClose={handleCloseMemberModal}
            />
        </>
    );
}
