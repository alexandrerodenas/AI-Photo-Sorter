import React, { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from './services/types.ts';
import PhotoSorter from './components/PhotoSorter';
import Onboarding from './components/Onboarding';
import { storageService } from './services/storage';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedProfile = storageService.loadUserProfile();

    // Handle migration from old profile structure for existing users
    if (loadedProfile) {
      if ((loadedProfile as any).rules && !loadedProfile.classificationRules) {
        loadedProfile.classificationRules = (loadedProfile as any).rules;
        delete (loadedProfile as any).rules;
      }
      if (!loadedProfile.detectionRules) {
        loadedProfile.detectionRules = [];
      }
      if (!loadedProfile.thumbnailSize) {
        loadedProfile.thumbnailSize = 'M';
      }
    }

    setUserProfile(loadedProfile);
    setIsLoading(false);

    // Set dark mode from system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleProfileUpdate = useCallback((profile: UserProfile) => {
    storageService.saveUserProfile(profile);
    setUserProfile(profile);
  }, []);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
          <p className="text-xl animate-pulse">Loading your space... ✨</p>
        </div>
    );
  }

  return (
      <div className="min-h-screen font-sans">
        {userProfile ? (
            <PhotoSorter userProfile={userProfile} onProfileUpdate={handleProfileUpdate} />
        ) : (
            <Onboarding onProfileSave={handleProfileUpdate} />
        )}
      </div>
  );
};

export default App;