
import React, { useState, useMemo } from 'react';
import type { UserProfile, Photo } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import { usePhotoManager } from '../hooks/usePhotoManager.ts';
import PhotoCard from './PhotoCard.tsx';
import { ProfileEditor } from './ProfileEditor.tsx';
import { Spinner } from './ui.tsx';
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
  LayoutGrid,
  FolderTree,
  ChevronRight,
  Folder,
} from 'lucide-react';

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
  } = usePhotoManager(userProfile);

  const [filterLabel, setFilterLabel] = useState<string>('');
  const [isProfileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'folder'>('grid');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([PhotoStatus.ANALYZED]));

  const toggleFolder = (key: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filteredPhotos = useMemo(() => {
    const photosArray = Array.from(photos.values());
    if (!filterLabel.trim()) return photosArray;
    const lowercasedFilter = filterLabel.toLowerCase();
    return photosArray.filter(p =>
        p.status === PhotoStatus.ANALYZED && p.predictions.some(pred => pred.label.toLowerCase().includes(lowercasedFilter))
    );
  }, [photos, filterLabel]);

  const groupedPhotos = useMemo(() => {
    const groups: {
      [PhotoStatus.ANALYZED]: Record<string, Photo[]>;
      [PhotoStatus.QUEUED]: Photo[];
      [PhotoStatus.ANALYZING]: Photo[];
      [PhotoStatus.ERROR]: Photo[];
    } = {
      [PhotoStatus.ANALYZED]: {},
      [PhotoStatus.QUEUED]: [],
      [PhotoStatus.ANALYZING]: [],
      [PhotoStatus.ERROR]: [],
    };

    const photosToGroup = Array.from(photos.values());

    for (const photo of photosToGroup) {
      if (photo.status === PhotoStatus.ANALYZED) {
        const topPrediction = photo.predictions.length > 0
            ? photo.predictions.reduce((max, p) => p.score > max.score ? p : max, photo.predictions[0])
            : null;
        const label = topPrediction ? topPrediction.label : 'Uncategorized';
        const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

        if (!groups[PhotoStatus.ANALYZED][capitalizedLabel]) {
          groups[PhotoStatus.ANALYZED][capitalizedLabel] = [];
        }
        groups[PhotoStatus.ANALYZED][capitalizedLabel].push(photo);
      } else {
        if (!groups[photo.status]) {
          groups[photo.status] = [];
        }
        groups[photo.status].push(photo);
      }
    }

    const sortedAnalyzed = Object.keys(groups[PhotoStatus.ANALYZED])
        .sort((a, b) => a.localeCompare(b))
        .reduce((obj, key) => {
          obj[key] = groups[PhotoStatus.ANALYZED][key];
          return obj;
        }, {} as Record<string, Photo[]>);

    // Move 'Uncategorized' to the end
    if (sortedAnalyzed['Uncategorized']) {
      const uncategorized = sortedAnalyzed['Uncategorized'];
      delete sortedAnalyzed['Uncategorized'];
      sortedAnalyzed['Uncategorized'] = uncategorized;
    }

    groups[PhotoStatus.ANALYZED] = sortedAnalyzed;

    return groups;
  }, [photos]);

  const noAnalyzedPhotos = useMemo(() =>
          Array.from(photos.values()).every(p => p.status !== PhotoStatus.ANALYZED),
      [photos]);

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
              <button
                  onClick={handleLoadPhotos}
                  disabled={isLoading || !isApiSupported}
                  className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  title={!isApiSupported ? "Your browser is not supported for this feature." : "Select a directory to load photos"}
              >
                {isLoading ? <Spinner className="w-5 h-5"/> : 'Select Directory'}
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
        <main className="flex-1 p-6 flex flex-col">
          {photos.size > 0 && !isLoading && (
              <div className="flex justify-end items-center mb-4 flex-shrink-0">
                <div className="flex items-center p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                  <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
                      aria-label="Grid View"
                      title="Grid View"
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                      onClick={() => setViewMode('folder')}
                      className={`p-2 rounded-md transition-colors ${viewMode === 'folder' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
                      aria-label="Folder View"
                      title="Folder View"
                  >
                    <FolderTree className="w-5 h-5" />
                  </button>
                </div>
              </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {photos.size === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                  <FolderOpen className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600" />
                  <h2 className="text-2xl font-semibold">Your workspace is empty</h2>
                  <p className="mt-2 max-w-sm">Click 'Select Directory' on the left to begin your photo sorting adventure!</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                  {filteredPhotos.map(photo => (
                      <PhotoCard key={photo.id} photo={photo} onSelect={handleSelectPhoto} onView={setViewingPhoto} />
                  ))}
                </div>
            ) : (
                <div className="space-y-4">
                  {Object.entries(groupedPhotos).map(([status, content]) => {
                    const isAnalyzed = status === PhotoStatus.ANALYZED;
                    const photoList = isAnalyzed ? Object.values(content as Record<string, Photo[]>).flat() : (content as Photo[]);
                    if (photoList.length === 0) return null;
                    const isStatusExpanded = expandedFolders.has(status);

                    return (
                        <div key={status}>
                          <div onClick={() => toggleFolder(status)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-700/60 cursor-pointer transition-colors">
                            <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isStatusExpanded ? 'rotate-90' : ''}`} />
                            <Folder className="w-6 h-6 text-secondary" />
                            <h3 className="font-bold text-lg capitalize">{status.toLowerCase().replace(/_/g, ' ')}</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">({photoList.length} photos)</span>
                          </div>

                          {isStatusExpanded && (
                              <div className="pl-11 pt-3 space-y-3">
                                {isAnalyzed ? (
                                    Object.entries(content as Record<string, Photo[]>).map(([label, labelPhotos]) => {
                                      const folderKey = `${status}-${label}`;
                                      const isLabelExpanded = expandedFolders.has(folderKey);
                                      return (
                                          <div key={folderKey}>
                                            <div onClick={() => toggleFolder(folderKey)} className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-200/60 dark:hover:bg-gray-700/60 cursor-pointer transition-colors">
                                              <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isLabelExpanded ? 'rotate-90' : ''}`} />
                                              <Folder className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                              <h4 className="font-semibold">{label}</h4>
                                              <span className="text-xs text-gray-500 dark:text-gray-400">({labelPhotos.length})</span>
                                            </div>
                                            {isLabelExpanded && (
                                                <div className="pl-7 pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
                                                  {labelPhotos.map(photo => <PhotoCard key={photo.id} photo={photo} onSelect={handleSelectPhoto} onView={setViewingPhoto} />)}
                                                </div>
                                            )}
                                          </div>
                                      );
                                    })
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                                      {(content as Photo[]).map(photo => <PhotoCard key={photo.id} photo={photo} onSelect={handleSelectPhoto} onView={setViewingPhoto} />)}
                                    </div>
                                )}
                              </div>
                          )}
                        </div>
                    );
                  })}
                </div>
            )}
          </div>
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
