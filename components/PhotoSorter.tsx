

import React, { useState, useMemo } from 'react';
import type { UserProfile, Photo } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import { usePhotoManager } from '../hooks/usePhotoManager.ts';

import PhotoSorterSidebar from './PhotoSorterSidebar.tsx';
import PhotoContent from './PhotoContent.tsx';
import PhotoViewerModal from './PhotoViewerModal.tsx';
import ProfileSettingsModal from './ProfileSettingsModal.tsx';

interface PhotoSorterProps {
  userProfile: UserProfile;
  onProfileUpdate: (newProfile: UserProfile) => void;
}

const PhotoSorter: React.FC<PhotoSorterProps> = ({ userProfile, onProfileUpdate }) => {
  const {
    photos,
    statusMessage,
    isLoading,
    isApiSupported,
    handleLoadPhotos,
    handleSelectPhoto,
    selectedPhotos,
    handleDeleteSelected,
    handleApplyRulesManually,
    handleSelectAll,
    handleClearSelection,
    isolateSelection,
    handleToggleIsolateSelection,
    tfBackend,
    allAvailableLabels,
    allAvailableClassificationLabels,
    allAvailableDetectionLabels,
  } = usePhotoManager(userProfile);

  const [filterLabel, setFilterLabel] = useState<string>('');
  const [isProfileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);

  const noAnalyzedPhotos = useMemo(() =>
          Array.from(photos.values()).every(p => p.status !== PhotoStatus.ANALYZED),
      [photos]);

  return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <PhotoSorterSidebar
            userProfile={userProfile}
            onOpenProfileSettings={() => setProfileModalOpen(true)}
            onLoadPhotos={handleLoadPhotos}
            isLoading={isLoading}
            isApiSupported={isApiSupported}
            filterLabel={filterLabel}
            onFilterChange={setFilterLabel}
            onSelectAll={() => handleSelectAll(filterLabel)}
            onClearSelection={() => handleClearSelection(filterLabel)}
            onApplyRules={handleApplyRulesManually}
            onDeleteSelected={handleDeleteSelected}
            selectedPhotoCount={selectedPhotos.length}
            totalPhotoCount={photos.size}
            statusMessage={statusMessage}
            noAnalyzedPhotos={noAnalyzedPhotos}
            tfBackend={tfBackend}
            isolateSelection={isolateSelection}
            onToggleIsolateSelection={handleToggleIsolateSelection}
            allAvailableLabels={allAvailableLabels}
        />

        <PhotoContent
            photos={photos}
            isLoading={isLoading}
            filterLabel={filterLabel}
            onSelectPhoto={handleSelectPhoto}
            onViewPhoto={setViewingPhoto}
            isolateSelection={isolateSelection}
        />

        <PhotoViewerModal
            photo={viewingPhoto}
            onClose={() => setViewingPhoto(null)}
        />

        <ProfileSettingsModal
            isOpen={isProfileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            userProfile={userProfile}
            onSave={onProfileUpdate}
            allAvailableClassificationLabels={allAvailableClassificationLabels}
            allAvailableDetectionLabels={allAvailableDetectionLabels}
        />
      </div>
  );
};

export default PhotoSorter;