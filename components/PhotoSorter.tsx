import * as React from 'react';
import type { UserProfile, Photo } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import { usePhotoManager } from '../hooks/usePhotoManager.ts';

import PhotoSorterSidebar from './PhotoSorterSidebar.tsx';
import PhotoContent from './PhotoContent.tsx';
import PhotoViewerModal from './PhotoViewerModal.tsx';
import ProfileSettingsModal from './ProfileSettingsModal.tsx';
import ConfirmDeleteModal from './ConfirmDeleteModal.tsx';

interface PhotoSorterProps {
  userProfile: UserProfile;
  onProfileUpdate: (newProfile: UserProfile) => void;
}

const PhotoSorter: React.FC<PhotoSorterProps> = ({ userProfile, onProfileUpdate }) => {
  const [filterLabel, setFilterLabel] = React.useState<string>('');
  const [isProfileModalOpen, setProfileModalOpen] = React.useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = React.useState<Photo | null>(null);

  const {
    photos,
    statusMessage,
    isLoading,
    isApiSupported,
    handleLoadPhotos,
    handleSelectPhoto,
    selectedPhotos,
    handleRequestDelete,
    handleApplyRulesManually,
    handleSelectAll,
    handleClearSelection,
    isolateSelection,
    handleToggleIsolateSelection,
    tfBackend,
    allAvailableLabels,
    allAvailableClassificationLabels,
    allAvailableDetectionLabels,
    modelsLoadState,
    handleCreateRuleFromSelection,
    handleCreateRuleFromFilter,
    savedPhotos,
    handleToggleSavePhoto,
    isolateSaved,
    handleToggleIsolateSaved,
    handleMoveSavedPhotos,
    confirmDeleteState,
    handleConfirmDelete,
    handleConfirmDeleteKeepSaved,
    handleCancelDelete,
  } = usePhotoManager({ userProfile, onProfileUpdate, filterLabel });


  const noAnalyzedPhotos = React.useMemo(() =>
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
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onApplyRules={handleApplyRulesManually}
            onDeleteSelected={handleRequestDelete}
            selectedPhotoCount={selectedPhotos.length}
            totalPhotoCount={photos.size}
            statusMessage={statusMessage}
            noAnalyzedPhotos={noAnalyzedPhotos}
            tfBackend={tfBackend}
            isolateSelection={isolateSelection}
            onToggleIsolateSelection={handleToggleIsolateSelection}
            allAvailableLabels={allAvailableLabels}
            modelsLoadState={modelsLoadState}
            onCreateRuleFromSelection={handleCreateRuleFromSelection}
            onCreateRuleFromFilter={handleCreateRuleFromFilter}
            savedPhotoCount={savedPhotos.length}
            isolateSaved={isolateSaved}
            onToggleIsolateSaved={handleToggleIsolateSaved}
            onMoveSavedPhotos={handleMoveSavedPhotos}
        />

        <PhotoContent
            photos={photos}
            isLoading={isLoading}
            filterLabel={filterLabel}
            onFilterChange={setFilterLabel}
            onSelectPhoto={handleSelectPhoto}
            onViewPhoto={setViewingPhoto}
            isolateSelection={isolateSelection}
            isolateSaved={isolateSaved}
            thumbnailSize={userProfile.thumbnailSize ?? 'M'}
            onToggleSavePhoto={handleToggleSavePhoto}
        />

        <PhotoViewerModal
            photo={viewingPhoto}
            onClose={() => setViewingPhoto(null)}
        />

        <ConfirmDeleteModal
            isOpen={confirmDeleteState.isOpen}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            onConfirmKeepSaved={handleConfirmDeleteKeepSaved}
            selectedCount={selectedPhotos.length}
            savedCount={confirmDeleteState.savedCount}
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