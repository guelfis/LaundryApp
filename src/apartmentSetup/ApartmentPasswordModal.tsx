import { useState } from "react";
import BottomModal from "../components/BottomModal";

interface BottomModalProps {
  isModalOpen: boolean;
  handleCloseModal: () => void;
  apartmentName: string | null;
  handleConfirm: () => void;
}

export const ApartmentPasswordModal = ({
    isModalOpen,
    handleCloseModal,
    apartmentName,
    handleConfirm
}: BottomModalProps
    
) => {
      const [password, setPassword] = useState('');
    
    return (
        <BottomModal
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={`Join ${apartmentName}`}
      >
        <p className="text-gray-500 mb-6">Please enter the apartment password to continue.</p>
        
        <input
          type="password"
          placeholder="Enter password"
          className="w-full p-4 bg-gray-100 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />

        <div className="flex gap-4">
          <button 
            onClick={handleCloseModal}
            className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 rounded-xl active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={
                () => {
                    setPassword(''); // Clear password field on confirm
                    handleConfirm();
                }
            }
            className="flex-1 py-4 font-bold text-white bg-blue-600 rounded-xl shadow-md active:scale-95 transition-all"
          >
            Confirm
          </button>
        </div>
      </BottomModal>
    );
    };