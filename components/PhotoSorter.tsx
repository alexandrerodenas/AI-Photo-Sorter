import * as React from 'react';
import type { UserProfile, Photo } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import { usePhotoManager } from '../hooks/usePhotoManager.ts';

import PhotoSorterSidebar from './PhotoSorterSidebar.tsx';
import PhotoContent from './PhotoContent.tsx';
import PhotoViewerModal from './PhotoViewerModal.tsx';
import ProfileSettingsModal from './ProfileSettingsModal.tsx';
import ConfirmDeleteModal from './ConfirmDeleteModal.tsx';
import { Menu } from "lucide-react";

interface PhotoSorterProps {
  userProfile: UserProfile;
  onProfileUpdate: (newProfile: UserProfile) => void;
}

const PhotoSorter: React.FC<PhotoSorterProps> = ({ userProfile, onProfileUpdate }) => {
  const [filterLabel, setFilterLabel] = React.useState<string>('');
  const [isProfileModalOpen, setProfileModalOpen] = React.useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = React.useState<Photo | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024); // lg breakpoint
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

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
    processingQueueCount,
    handleBulkSave,
  } = usePhotoManager({ userProfile, onProfileUpdate, filterLabel });


  const noAnalyzedPhotos = React.useMemo(() =>
          Array.from(photos.values()).every(p => p.status !== PhotoStatus.ANALYZED),
      [photos]);

  return (
      <div className="relative h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
        <PhotoSorterSidebar
            isOpen={isSidebarOpen}
            onToggle={toggleSidebar}
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
            onDeleteSelected={() => handleRequestDelete()}
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
            processingQueueCount={processingQueueCount}
        />

        {isSidebarOpen && (
            <div
                onClick={toggleSidebar}
                className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                aria-hidden="true"
            ></div>
        )}

        <div className="flex-1 flex flex-col transition-all duration-300 overflow-y-auto">
          <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Pixo Logo" className="w-8 h-8" />
              <h1 className="text-xl font-bold tracking-tight">Pixo</h1>
            </div>
            <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </header>

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
              onRequestDelete={handleRequestDelete}
              onBulkSave={handleBulkSave}
          />
        </div>

        <PhotoViewerModal
            photo={viewingPhoto}
            onClose={() => setViewingPhoto(null)}
        />

        <ConfirmDeleteModal
            isOpen={confirmDeleteState.isOpen}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            onConfirmKeepSaved={handleConfirmDeleteKeepSaved}
            deleteCount={confirmDeleteState.photosToDelete.length}
            savedCount={confirmDeleteState.photosToDelete.filter(p => p.isSaved).length}
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
