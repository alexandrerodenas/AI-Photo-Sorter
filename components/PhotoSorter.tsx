
import React, { useState, useMemo } from 'react';
import type { UserProfile, Photo } from '../types';
import { PhotoStatus } from '../types';
import { usePhotoManager } from '../hooks/usePhotoManager';
import PhotoCard from './PhotoCard';
import { ProfileEditor } from './ProfileEditor';
import { Spinner } from './ui';
import {
  FolderOpen,
  Trash2,
  X,
  User,
  Filter,
  Search,
  Zap,
  Sparkles,
  Settings2,
  CheckSquare,
  XSquare,
} from 'lucide-react';

interface PhotoSorterProps {
  userProfile: UserProfile;
  onProfileUpdate: (newProfile: UserProfile) => void;
}

const PhotoSorter: React.FC<PhotoSorterProps> = ({ userProfile, onProfileUpdate }) => {
  const {
    photos,
    directoryPath,
    setDirectoryPath,
    statusMessage,
    isLoading,
    handleLoadPhotos,
    handleSelectPhoto,
    selectedPhotos,
    handleDeleteSelected,
    handleApplyRulesManually,
    handleSelectAll,
    handleClearSelection,
  } = usePhotoManager(userProfile);

  const [filterLabel, setFilterLabel] = useState<string>('');
  const [isProfileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);

  const filteredPhotos = useMemo(() => {
    const photosArray = Array.from(photos.values());
    if (!filterLabel.trim()) return photosArray;
    const lowercasedFilter = filterLabel.toLowerCase();
    return photosArray.filter(p =>
        p.status === PhotoStatus.ANALYZED && p.predictions.some(pred => pred.label.toLowerCase().includes(lowercasedFilter))
    );
  }, [photos, filterLabel]);

  const noAnalyzedPhotos = useMemo(() =>
          Array.from(photos.values()).every(p => p.status !== PhotoStatus.ANALYZED),
      [photos]);

  console.log("No analysed photo", noAnalyzedPhotos)
  console.log("loading", isLoading)

  // --- RENDER ---
  return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <aside className="w-80 bg-white dark:bg-gray-800 p-6 flex flex-col shadow-lg shrink-0">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Photo Sorter</h1>
          </div>

          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="w-10 h-10 bg-primary/20 text-primary flex items-center justify-center rounded-full">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back,</p>
              <p className="font-bold text-lg">{userProfile.firstName}! 😊</p>
            </div>
            <button onClick={() => setProfileModalOpen(true)} className="ml-auto p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
              <Settings2 className="w-5 h-5" />
            </button>
          </div>

          {/* Directory Loader */}
          <div className="mb-6">
            <label className="font-semibold mb-2 flex items-center gap-2"><FolderOpen className="w-5 h-5 text-secondary" /> Load Photos</label>
            <div className="flex gap-2">
              <input type="text" value={directoryPath} onChange={(e) => setDirectoryPath(e.target.value)} placeholder="Enter directory path..." className="flex-grow w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition"/>
              <button onClick={handleLoadPhotos} disabled={isLoading} className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                {isLoading ? <Spinner className="w-5 h-5"/> : 'Load'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <label className="font-semibold mb-2 flex items-center gap-2"><Filter className="w-5 h-5 text-secondary" /> Filter by Label</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={filterLabel} onChange={(e) => setFilterLabel(e.target.value)} placeholder="e.g., cat, dog, car..." className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition"/>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                  onClick={handleSelectAll}
                  disabled={isLoading || noAnalyzedPhotos}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:bg-gray-400/30 disabled:text-gray-500 disabled:cursor-not-allowed"
                  title={noAnalyzedPhotos && !isLoading ? "No analyzed photos to select" : "Select all analyzed photos"}
              >
                <CheckSquare className="w-4 h-4" /> Select All
              </button>
              <button
                  onClick={handleClearSelection}
                  disabled={selectedPhotos.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:bg-gray-400/30 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <XSquare className="w-4 h-4" /> Clear All
              </button>
            </div>
            <button
                onClick={handleApplyRulesManually}
                disabled={isLoading || noAnalyzedPhotos}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary-dark transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                title={noAnalyzedPhotos && !isLoading ? "No analyzed photos to apply rules to" : "Apply custom rules to all analyzed photos"}
            >
              <Zap className="w-5 h-5"/> Apply Manual Rules
            </button>
            <button onClick={handleDeleteSelected} disabled={selectedPhotos.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition disabled:bg-red-400/50 disabled:cursor-not-allowed">
              <Trash2 className="w-5 h-5"/> Delete Selected ({selectedPhotos.length})
            </button>
          </div>

          {/* Counters & Status */}
          <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-sm font-medium mb-2">
              <span>Total Photos</span>
              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full">{photos.size}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium">
              <span>Selected</span>
              <span className="px-2 py-0.5 bg-accent/20 text-accent rounded-full">{selectedPhotos.length}</span>
            </div>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md text-center">
              <p>{statusMessage}</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {photos.size === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                <FolderOpen className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600" />
                <h2 className="text-2xl font-semibold">Your workspace is empty</h2>
                <p className="mt-2 max-w-sm">Enter a directory path on the left and click 'Load' to begin your photo sorting adventure!</p>
              </div>
          ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                {filteredPhotos.map(photo => (
                    <PhotoCard key={photo.id} photo={photo} onSelect={handleSelectPhoto} onView={setViewingPhoto} />
                ))}
              </div>
          )}
        </main>

        {/* Photo Viewer Modal */}
        {viewingPhoto && (
            <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center" onClick={() => setViewingPhoto(null)}>
              <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                <div className="md:w-2/3 bg-black/90 flex items-center justify-center rounded-l-lg">
                  <img src={viewingPhoto.objectURL} alt="Enlarged view" className="max-w-full max-h-[90vh] md:max-h-[85vh] object-contain"/>
                </div>
                <div className="md:w-1/3 p-6 flex flex-col overflow-y-auto">
                  <button onClick={() => setViewingPhoto(null)} className="absolute top-3 right-3 p-1.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full hover:bg-red-500 hover:text-white transition">
                    <X className="w-5 h-5"/>
                  </button>
                  <h3 className="text-lg font-bold mb-4">AI Predictions</h3>
                  {viewingPhoto.status === PhotoStatus.ANALYZED ? (
                      <ul className="space-y-3">
                        {viewingPhoto.predictions.length > 0 ? viewingPhoto.predictions.map((p, i) => (
                            <li key={i} className="text-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold capitalize">{p.label}</span>
                                <span className="font-mono text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">{`${(p.score * 100).toFixed(1)}%`}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full" style={{width: `${p.score * 100}%`}}></div>
                              </div>
                            </li>
                        )) : <p className="text-gray-500">No objects detected.</p>}
                      </ul>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Spinner className="w-10 h-10 mb-2"/>
                        <p>Analyzing...</p>
                      </div>
                  )}
                  <div className="mt-auto pt-4">
                    <p className="text-xs text-gray-400 truncate" title={viewingPhoto.id}>{viewingPhoto.id}</p>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Profile Modal */}
        {isProfileModalOpen && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setProfileModalOpen(false)}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><User className="text-primary"/> User Profile & Rules</h2>
                  <button onClick={() => setProfileModalOpen(false)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6 overflow-y-auto">
                  <ProfileEditor currentProfile={userProfile} onSave={onProfileUpdate} closeModal={() => setProfileModalOpen(false)}/>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default PhotoSorter;
