import React, { useState, useMemo } from 'react';
import type { Photo, ThumbnailSize } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import PhotoCard from './PhotoCard.tsx';
import FolderView from './FolderView.tsx';
import {
  FolderOpen,
  LayoutGrid,
  FolderTree,
  EyeOff,
  Filter,
  Heart,
} from 'lucide-react';

interface PhotoGridProps {
  photos: Photo[];
  onSelectPhoto: (id: string) => void;
  onViewPhoto: (photo: Photo) => void;
  thumbnailSize: ThumbnailSize;
  onFilterChange: (label: string) => void;
  onToggleSavePhoto: (id: string) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onSelectPhoto, onViewPhoto, thumbnailSize, onFilterChange, onToggleSavePhoto }) => {
  const sizeClasses: Record<ThumbnailSize, string> = {
    XS: 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12',
    S: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10',
    M: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8',
    L: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    XL: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  };

  return (
      <div className={`grid ${sizeClasses[thumbnailSize]} gap-4`}>
        {photos.map(photo => (
            <PhotoCard key={photo.id} photo={photo} onSelect={onSelectPhoto} onView={onViewPhoto} onFilterChange={onFilterChange} onToggleSave={onToggleSavePhoto} />
        ))}
      </div>
  );
};

interface PhotoContentProps {
  photos: Map<string, Photo>;
  isLoading: boolean;
  filterLabel: string;
  isolateSelection: boolean;
  isolateSaved: boolean;
  onSelectPhoto: (id: string) => void;
  onViewPhoto: (photo: Photo) => void;
  thumbnailSize: ThumbnailSize;
  onFilterChange: (label: string) => void;
  onToggleSavePhoto: (id: string) => void;
}

const PhotoContent: React.FC<PhotoContentProps> = ({
                                                     photos,
                                                     isLoading,
                                                     filterLabel,
                                                     isolateSelection,
                                                     isolateSaved,
                                                     onSelectPhoto,
                                                     onViewPhoto,
                                                     thumbnailSize,
                                                     onFilterChange,
                                                     onToggleSavePhoto,
                                                   }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'folder'>('grid');

  const photosToShow = useMemo(() => {
    let photosToReturn = photos;

    if (isolateSaved) {
      const isolatedMap = new Map<string, Photo>();
      for (const [id, photo] of photosToReturn.entries()) {
        if (photo.isSaved) {
          isolatedMap.set(id, photo);
        }
      }
      return isolatedMap;
    }

    if (isolateSelection) {
      const isolatedMap = new Map<string, Photo>();
      for (const [id, photo] of photosToReturn.entries()) {
        if (photo.selected) {
          isolatedMap.set(id, photo);
        }
      }
      return isolatedMap;
    }

    return photosToReturn;
  }, [photos, isolateSelection, isolateSaved]);

  const filteredPhotosForGrid = useMemo(() => {
    const photosArray = Array.from(photosToShow.values());

    // First, filter out unprocessed photos
    const processedPhotos = photosArray.filter(p => p.status !== PhotoStatus.QUEUED && p.status !== PhotoStatus.ANALYZING);

    if (!filterLabel.trim()) {
      return processedPhotos; // Return all processed if no filter
    }

    const lowercasedFilter = filterLabel.toLowerCase();
    // Then apply label filter on the processed photos
    return processedPhotos.filter(p =>
            (p.status === PhotoStatus.ANALYZED || p.status === PhotoStatus.UNCATEGORIZED) && (
                p.classifications.some(pred => pred.label.toLowerCase().includes(lowercasedFilter)) ||
                p.detections.some(pred => pred.label.toLowerCase().includes(lowercasedFilter))
            )
    );
  }, [photosToShow, filterLabel]);


  const renderContent = () => {
    if (photos.size === 0 && !isLoading) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <FolderOpen className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600" />
            <h2 className="text-2xl font-semibold">Your workspace is empty</h2>
            <p className="mt-2 max-w-sm">Click 'Select Directory' on the left to begin your photo organizing adventure!</p>
          </div>
      );
    }

    if (photosToShow.size === 0) {
      let title = "No Matching Photos";
      let message = "No photos match the current criteria. Try adjusting your search.";
      let Icon = Filter;

      if (isolateSelection) {
        title = "No Selected Photos";
        message = "You're in isolation mode, but no photos are selected. Clear the isolation to see all photos.";
        Icon = EyeOff;
      } else if (isolateSaved) {
        title = "No Saved Photos";
        message = "You're in isolation mode, but no photos are saved. Click the heart on photos to save them.";
        Icon = Heart;
      }


      return (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <Icon className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600" />
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-2 max-w-sm">{message}</p>
          </div>
      )
    }

    if (viewMode === 'grid') {
      if (filteredPhotosForGrid.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
              <Filter className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600" />
              <h2 className="text-2xl font-semibold">No Matching Photos</h2>
              <p className="mt-2 max-w-sm">No photos match your label filter. Try a different search term.</p>
            </div>
        );
      }
      return <PhotoGrid photos={filteredPhotosForGrid} onSelectPhoto={onSelectPhoto} onViewPhoto={onViewPhoto} thumbnailSize={thumbnailSize} onFilterChange={onFilterChange} onToggleSavePhoto={onToggleSavePhoto} />;
    }

    return <FolderView photos={photosToShow} onSelectPhoto={onSelectPhoto} onViewPhoto={onViewPhoto} thumbnailSize={thumbnailSize} onFilterChange={onFilterChange} onToggleSave={onToggleSavePhoto} />;
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