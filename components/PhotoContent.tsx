import React, { useState, useMemo } from 'react';
import type { Photo } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import PhotoCard from './PhotoCard.tsx';
import FolderView from './FolderView.tsx';
import {
  FolderOpen,
  LayoutGrid,
  FolderTree,
} from 'lucide-react';

interface PhotoGridProps {
  photos: Photo[];
  onSelectPhoto: (id: string) => void;
  onViewPhoto: (photo: Photo) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onSelectPhoto, onViewPhoto }) => {
  return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {photos.map(photo => (
            <PhotoCard key={photo.id} photo={photo} onSelect={onSelectPhoto} onView={onViewPhoto} />
        ))}
      </div>
  );
};

interface PhotoContentProps {
  photos: Map<string, Photo>;
  isLoading: boolean;
  filterLabel: string;
  onSelectPhoto: (id: string) => void;
  onViewPhoto: (photo: Photo) => void;
}

const PhotoContent: React.FC<PhotoContentProps> = ({
                                                     photos,
                                                     isLoading,
                                                     filterLabel,
                                                     onSelectPhoto,
                                                     onViewPhoto
                                                   }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'folder'>('grid');

  const filteredPhotos = useMemo(() => {
    const photosArray = Array.from(photos.values());
    if (!filterLabel.trim()) return photosArray;
    const lowercasedFilter = filterLabel.toLowerCase();
    return photosArray.filter(p =>
        p.status === PhotoStatus.ANALYZED && p.predictions.some(pred => pred.label.toLowerCase().includes(lowercasedFilter))
    );
  }, [photos, filterLabel]);


  const renderContent = () => {
    if (photos.size === 0 && !isLoading) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <FolderOpen className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600" />
            <h2 className="text-2xl font-semibold">Your workspace is empty</h2>
            <p className="mt-2 max-w-sm">Click 'Select Directory' on the left to begin your photo sorting adventure!</p>
          </div>
      );
    }

    if (viewMode === 'grid') {
      return <PhotoGrid photos={filteredPhotos} onSelectPhoto={onSelectPhoto} onViewPhoto={onViewPhoto} />;
    }

    return <FolderView photos={photos} onSelectPhoto={onSelectPhoto} onViewPhoto={onViewPhoto} />;
  }

  return (
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
          {renderContent()}
        </div>
      </main>
  );
};

export default PhotoContent;
