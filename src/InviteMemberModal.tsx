import { useState } from "react";
import BottomModal from "./components/BottomModal";
import { useGenerateInviteLink } from "./useApartments";
import { Check, Copy, Link2, Share2 } from "lucide-react";

interface InviteMemberModalProps {
    apartmentId: string;
    apartmentName: string;
    isModalOpen: boolean;
    onClose?: () => void;
}

export default function InviteMemberModal({ apartmentId, apartmentName, isModalOpen, onClose }: InviteMemberModalProps) {

    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Main Invitation Generation Trigger
    const generateLinkMutation = useGenerateInviteLink();
    const handleCreateLink = async () => {
        try {
            const token = await generateLinkMutation.mutateAsync({ apartmentId });
            // Compose the final clean link matching your web app route configuration
            const finalUrl = `${window.location.origin}/setup?invite=${token}`;
            setGeneratedLink(finalUrl);
        } catch (err) {
            console.error("Failed to generate invite:", err);
        }
    };
    const handleCopyLink = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Native Mobile Share API Wrapper
    const handleShareLink = async () => {
        if (!generatedLink) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join ${apartmentName}`,
                    text: `Use this invitation link to join our apartment schedule!`,
                    url: generatedLink,
                });
            } catch (err) {
                console.log("Share dismissed or failed", err);
            }
        } else {
            // Fallback fallback: Copy straight to user clipboard
            handleCopyLink();
        }
    };

    const handleCloseModal = () => {
        setGeneratedLink(null);
        setCopied(false);
        if (onClose) {
            onClose();
        }
    }

    return(
        <BottomModal
            isOpen={isModalOpen} 
            onClose={handleCloseModal}
            title="Invite Roommate"
        >
        <div className="space-y-6">
            <p className="text-sm text-gray-500 dark:text-slate-400">
                Generate a secure link to add an active member straight to <span className="font-bold text-gray-800 dark:text-white">{apartmentName}</span>.
            </p>

            {!generatedLink ? (
                /* Initial Step: Show generation triggers */
                <button
                    onClick={handleCreateLink}
                    disabled={generateLinkMutation.isPending}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Link2 size={18} />
                    {generateLinkMutation.isPending ? "Generating..." : "Generate Invitation Link"}
                </button>
            ) : (
                /* Action Step: Display newly made link & native buttons */
                <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                        <input
                            type="text"
                            readOnly
                            value={generatedLink}
                            className="flex-1 bg-transparent text-xs text-gray-600 dark:text-slate-300 outline-none select-all truncate"
                        />
                        <button 
                            onClick={handleCopyLink}
                            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                        >
                            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleCloseModal}
                            className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-bold rounded-2xl"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleShareLink}
                            className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                        >
                            <Share2 size={18} />
                            Share Link
                        </button>
                    </div>
                </div>
            )}
        </div>
        </BottomModal>
    );
}