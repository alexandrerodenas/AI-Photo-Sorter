
import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfile, Photo } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import { usePhotoManager } from '../hooks/usePhotoManager.ts';
import { Menu, Sparkles } from 'lucide-react';

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
  } = usePhotoManager(userProfile);

  const [filterLabel, setFilterLabel] = useState<string>('');
  const [isProfileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const noAnalyzedPhotos = useMemo(() =>
          Array.from(photos.values()).every(p => p.status !== PhotoStatus.ANALYZED),
      [photos]);

  // Effect to close mobile menu on selection changes if needed, or other side effects
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Potentially close menu on navigation or action
    }
  }, [selectedPhotos, isMobileMenuOpen]);

  return (
      <div className="h-screen flex">
        {isMobileMenuOpen && (
            <div
                className="fixed inset-0 z-30 bg-black/60 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
            ></div>
        )}

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
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Photo Sorter</span>
            </div>
            {/* Placeholder for potential actions */}
            <div className="w-6 h-6"></div>
          </header>

          <PhotoContent
              photos={photos}
              isLoading={isLoading}
              filterLabel={filterLabel}
              onSelectPhoto={handleSelectPhoto}
              onViewPhoto={setViewingPhoto}
              isolateSelection={isolateSelection}
          />
        </div>


        <PhotoViewerModal
            photo={viewingPhoto}
            onClose={() => setViewingPhoto(null)}
        />

        <ProfileSettingsModal
            isOpen={isProfileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            userProfile={userProfile}
            onSave={onProfileUpdate}
            allAvailableLabels={allAvailableLabels}
        />
      </div>
  );
};

export default PhotoSorter;