
import React from 'react';
import type { UserProfile, ThumbnailSize } from '../services/types.ts';

interface ProfileEditorProps {
  profile: UserProfile;
  setProfile: (updater: (profile: UserProfile) => UserProfile) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, setProfile }) => {
  const thumbnailSizes: ThumbnailSize[] = ['XS', 'S', 'M', 'L', 'XL'];

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile(p => ({ ...p, [field]: value }));
  };

  return (
      <div className="space-y-6">
        {/* General Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">First Name</label>
            <input type="text" value={profile.firstName} onChange={e => handleInputChange('firstName', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary"/>
          </div>
          <div>
            <label className="block font-semibold mb-1">"Saved" Folder Name</label>
            <input type="text" value={profile.savedFolderName} onChange={e => handleInputChange('savedFolderName', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary"/>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block font-semibold">Thumbnail Size</label>
          <div className="flex items-center p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
            {thumbnailSizes.map(size => (
                <button
                    key={size}
                    onClick={() => handleInputChange('thumbnailSize', size)}
                    className={`flex-1 p-2 rounded-md transition-colors text-sm font-semibold ${
                        (profile.thumbnailSize || 'M') === size
                            ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                >
                  {size}
                </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={profile.autoApplyRules} onChange={e => handleInputChange('autoApplyRules', e.target.checked)} className="w-5 h-5 rounded text-primary focus:ring-primary"/>
            <span>Automatically apply all rules on photo load</span>
          </label>
        </div>

        {/* Uncategorized Rule Section */}
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold">Uncategorized Rule (Classification-based)</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If all AI **classification** scores for a photo are below this threshold, it will be classified as 'Uncategorized'. This helps filter out ambiguous images.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Confidence Threshold ({profile.unknownThreshold}%)</label>
            <input
                type="range"
                min="0"
                max="50"
                value={profile.unknownThreshold}
                onChange={e => handleInputChange('unknownThreshold', parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
            />
          </div>
        </div>
      </div>
  );
};
