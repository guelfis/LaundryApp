import React, { useContext, useEffect, useMemo, useState } from "react";
import SectionText from "../components/SectionText";
import MembersList from "../components/MembersList";
import { useApartmentMembers, useApartments, useDeleteOrLeaveApartment } from "../hooks/useApartments";
import InviteMemberModal from "../myApartment/InviteMemberModal";
import { checkIsAdminApartment, getCleanStorageItem, resolveCurrentUserId } from "../auth/authUtils";
import PendingRequestsSection from "../myApartment/PendingRequestsSection";
import ApartmentNameEditableSection from "../utils/ApartmentNameEditableSection";
import { BookingContext } from "../contexts/BookingContext";
import MemberModal from "../myApartment/MemberModal";
import { ApartmentMember } from "../lib/databaseTypes";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../routes/routes.constants";
import PageLayout from "../components/PageLayout";
import { PageHeader } from "../components/PageHeader";
import { Home } from "lucide-react";
import LeaveDeleteActionsBlock from "../components/LeaveDeleteActionsBlock";
import { updateApartmentName } from "../lib/apartments";


export default function MyApartmentTab() {
    const { t } = useTranslation();
    const history = useHistory();

    const { householdId, apartmentId } = useContext(BookingContext)!;
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [apartmentName, setApartmentName] = React.useState(getCleanStorageItem('apartmentName') || 'my apartment');
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);    

    useEffect(() => {
        resolveCurrentUserId().then(id => setCurrentUserId(id));
    }, []);

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    
    const { data: members = [] } = useApartmentMembers(apartmentId);
    const { leaveApartment, isLeaving, deleteApartment, isDeletingApartment } = useDeleteOrLeaveApartment();
    const { data: allApartments = [] } = useApartments(householdId);
    
    const existingNames = useMemo(() => {
    return allApartments
        .filter(apt => apt && apt.id !== apartmentId) 
        .map(apt => apt.display_name);
    }, [allApartments, apartmentId]);    
    const isUserAdmin = useMemo(() => checkIsAdminApartment(members, currentUserId), [members, currentUserId]);
    const admins = useMemo(() => members.filter(m => m.apartment_role === 'admin'), [members]);
    const canDeleteApartment = isUserAdmin && members.length === 1;
    const canLeaveApartment = !isUserAdmin || admins.length > 1;
    
    const membersMap = useMemo((): Record<string, ApartmentMember> => {
        return Object.fromEntries(members.map(m => [m.user_id, m]));
    }, [members]);

    if (!apartmentId){
        // we should never get here anyway
        console.error("Entering apartment tab without an apartment id set.")
        return;
    }

    const handleNameChange = async (newName: string) => {
        // 1. Optimistically update local UI states
        setApartmentName(newName);
        localStorage.setItem('apartmentName', newName);

        // 2. Persist downstream directly to Supabase remote database
        try {
            await updateApartmentName(apartmentId, newName);
        } catch (err) {
            console.error("Database sync failure:", err);
            alert(t('myApartmentTab.update_name_fail'));
        }
    };

    const handleDeleteApartment = async () => {
        const confirmFirst = window.confirm(t('myApartmentTab.delete_warning'));
        if (confirmFirst) {
            try {
                await deleteApartment(apartmentId);
                alert(t('myApartmentTab.delete_success'));
                history.push(ROUTES.APARTMENT_LOGIN, { replace: true }); 
            } catch (err) {
                const errorInstance = err as Error;
                console.error(t('myApartmentTab.delete_fail'), err);
                alert(`${t('myApartmentTab.delete_fail')}: ${errorInstance.message}`);
            }
        }
    };

    const handleLeaveApartment = async () => {
        if (window.confirm(t('myApartmentTab.release_warning'))) {
            try {
                await leaveApartment(apartmentId);
                history.push(ROUTES.APARTMENT_LOGIN, { replace: true });
            } catch (err) {
                const errorInstance = err as Error;
                console.error(t('myApartmentTab.release_fail'), err);
                alert(`${t('myApartmentTab.release_fail')}: ${errorInstance.message}`);
            }
        }
    };

    const handleCloseMemberModal = () => {
        setIsMemberModalOpen(false);
        setSelectedUserId(null); 
    };

    return (
        <PageLayout 
            header={
                <PageHeader 
                    title={t('dashboard.your_apartment')} 
                    icon={<Home className="w-7 h-7 text-blue-500" />} 
                    onBack={() => history.push(ROUTES.APARTMENT_LOGIN)} 
                />
            }
        >
            <div 
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                width: '100%',
                padding: '16px 20px',
                boxSizing: 'border-box',
                gap: '24px' // Sets a consistent, clean vertical gap between all your Section blocks
            }}
            >
                {/* Info Section Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <SectionText title={t('common.info')} />
                    <ApartmentNameEditableSection
                        apartmentName={apartmentName}
                        onNameChange={handleNameChange}
                        isEditing={isEditingName}
                        setIsEditing={setIsEditingName}
                        invalidNames={existingNames}
                    />
                </div>
                
                {/* Join Requests Section Block */}
                {isUserAdmin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <PendingRequestsSection apartmentId={apartmentId} />
                    </div>
                )}

                {/* Members List Section Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <SectionText title={t('myApartmentTab.members', { count: members.length })} />
                    <MembersList 
                        members={members}
                        currentUserId={currentUserId}
                        clickEnabled={isUserAdmin}
                        onMemberClick={(userId: string) => {
                            setIsMemberModalOpen(true);
                            setSelectedUserId(userId);
                        }}
                        onAddMemberClick={() => setIsInviteModalOpen(true)}
                    />
                </div>

                {/* More Actions Section Block */}
                <LeaveDeleteActionsBlock 
                    onLeave={handleLeaveApartment}
                    onDelete={handleDeleteApartment}
                    canLeave={canLeaveApartment}
                    canDelete={canDeleteApartment}
                    isLeaving={isLeaving}
                    isDeleting={isDeletingApartment}
                    leaveLabelKey={t('myApartmentTab.leave')}
                    deleteLabelKey={t('myApartmentTab.delete')}
                    infoTitleKey={t('myApartmentTab.info_title')}
                    infoMessageKey={t('myApartmentTab.info_message')} 
                />
            </div>
            {/* Modal overlays load below */}
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
        </PageLayout>
    );
}
