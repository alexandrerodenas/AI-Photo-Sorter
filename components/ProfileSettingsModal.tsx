

import React from 'react';
import type { UserProfile } from '../services/types.ts';
import { ProfileEditor } from './ProfileEditor.tsx';
import { User, X } from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSave: (newProfile: UserProfile) => void;
  allAvailableClassificationLabels: string[];
  allAvailableDetectionLabels: string[];
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose, userProfile, onSave, allAvailableClassificationLabels, allAvailableDetectionLabels }) => {
  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2"><User className="text-primary"/> User Profile & Rules</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-6 overflow-y-auto">
            <ProfileEditor currentProfile={userProfile} onSave={onSave} closeModal={onClose} allAvailableClassificationLabels={allAvailableClassificationLabels} allAvailableDetectionLabels={allAvailableDetectionLabels} />
          </div>
        </div>
      </div>
  );
};

export default ProfileSettingsModal;