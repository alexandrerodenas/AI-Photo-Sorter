import React, { useRef, useEffect } from 'react';
import type { Photo } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import { StatusPill } from './ui.tsx';
import { Check, Tag } from 'lucide-react';

interface PhotoCardProps {
  photo: Photo;
  onSelect: (id: string) => void;
  onView: (photo: Photo) => void;
}

function PhotoCard({ photo, onSelect, onView }: PhotoCardProps) {
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If a timer is already running, it's a double click.
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onView(photo); // Trigger the double-click action (view photo).
    } else {
      // Otherwise, it's the first click. Start a timer.
      clickTimeoutRef.current = setTimeout(() => {
        onSelect(photo.id); // If timer completes, trigger single-click action (select photo).
        clickTimeoutRef.current = null;
      }, 250); // 250ms window to detect a double click.
    }
  };

  // Find the prediction with the highest score
  const topPrediction = photo.status === PhotoStatus.ANALYZED && photo.predictions.length > 0
      ? photo.predictions.reduce((max, p) => p.score > max.score ? p : max, photo.predictions[0])
      : null;

  return (
      <div
          className="relative group aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
          onClick={handleClick}
      >
        <img src={photo.objectURL} alt={photo.id} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-opacity duration-300"></div>

        {photo.selected && (
            <div className="absolute inset-0 border-4 border-accent rounded-lg pointer-events-none">
              <div className="absolute top-2 right-2 bg-accent text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            </div>
        )}

        <StatusPill status={photo.status} />

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
          {topPrediction && (
              <div className="flex items-center justify-between text-white mb-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <Tag className="w-3 h-3 text-white/90 shrink-0" />
                  <p className="text-sm font-bold capitalize truncate" title={topPrediction.label}>
                    {topPrediction.label}
                  </p>
                </div>
                <span className="text-xs font-mono bg-white/20 px-1.5 py-0.5 rounded-full">
                        {`${(topPrediction.score * 100).toFixed(0)}%`}
                    </span>
              </div>
          )}
          <p className="text-white text-xs truncate" title={photo.id.split(/[\\/]/).pop()}>
            {photo.id.split(/[\\/]/).pop()}
          </p>
        </div>
      </div>
  );
};

export default React.memo(PhotoCard);