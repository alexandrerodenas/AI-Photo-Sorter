
import React, { useState, useMemo } from 'react';
import type { Photo } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import PhotoCard from './PhotoCard.tsx';
import { ChevronRight, Folder } from 'lucide-react';

interface FolderViewProps {
  photos: Map<string, Photo>;
  onSelectPhoto: (id: string) => void;
  onViewPhoto: (photo: Photo) => void;
}

const FolderView: React.FC<FolderViewProps> = ({ photos, onSelectPhoto, onViewPhoto }) => {
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

    if (sortedAnalyzed['Uncategorized']) {
      const uncategorized = sortedAnalyzed['Uncategorized'];
      delete sortedAnalyzed['Uncategorized'];
      sortedAnalyzed['Uncategorized'] = uncategorized;
    }
    groups[PhotoStatus.ANALYZED] = sortedAnalyzed;

    return groups;
  }, [photos]);

  return (
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
                                        {labelPhotos.map(photo => <PhotoCard key={photo.id} photo={photo} onSelect={onSelectPhoto} onView={onViewPhoto} />)}
                                      </div>
                                  )}
                                </div>
                            );
                          })
                      ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                            {(content as Photo[]).map(photo => <PhotoCard key={photo.id} photo={photo} onSelect={onSelectPhoto} onView={onViewPhoto} />)}
                          </div>
                      )}
                    </div>
                )}
              </div>
          );
        })}
      </div>
  );
};

export default FolderView;
