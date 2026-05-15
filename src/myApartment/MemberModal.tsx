import { LogOut, Shield } from "lucide-react";
import BottomModal from "../components/BottomModal";
import { ApartmentMember } from "../lib/databaseTypes";
import { useApartmentMembersActions } from "../useApartments";

const destructiveButtonStyle = "flex items-center justify-center gap-2 py-3 px-6 text-red-600 dark:text-red-400 text-base bg-transparent border-none rounded-xl active:bg-red-50 dark:active:bg-red-950/20 active:scale-[0.98] transition-all disabled:opacity-40";

interface MemberModalProps{
    member: ApartmentMember
    apartmentId: string;
    isModalOpen:boolean;
    onClose: () => void;
}
export default function MemberModal(
    {member, apartmentId, isModalOpen, onClose}: MemberModalProps
){
    
    const {promoteMember, removeMember} = useApartmentMembersActions(apartmentId);
    if (!member || !member.profiles) {
        return null; 
    }
    const handlePromoteToAdmin = async () => {
        try{
            await promoteMember(member.user_id);
        } catch (err){
            const errorInstance = err as Error;
            console.error("Failed to Promote the user to Admin", err);
            alert(`Could not promote member: ${errorInstance.message}`);
        }
    };

    const hanldeRemoveMember = async () => {
        try{
            await removeMember(member.user_id);
        } catch (err){
            const errorInstance = err as Error;
            console.error("Failed to Remove Member from the apartment", err);
            alert(`Could not remove member: ${errorInstance.message}`);
        }
    };


    return (
        <BottomModal
            title={member.profiles.full_name ?? ''}
            isOpen={isModalOpen}
            onClose={onClose} >
                <div className="pt-6 pb-2 mt-auto flex w-full">
                    {member.role !== 'admin' && (
                        <button
                            onClick={handlePromoteToAdmin}
                            className={destructiveButtonStyle}
                            >
                            <Shield size={18} className="text-red-600 dark:text-red-400" />
                            <span>{"Make admin"}</span>
                        </button>
                    )}
                    <button
                        onClick={hanldeRemoveMember}
                        className={destructiveButtonStyle}
                    >
                        <LogOut size={18} className="text-red-600 dark:text-red-400" />
                        <span>{"Remove member"}</span>
                    </button>
                    
                </div>
                
        </BottomModal>
    );
}