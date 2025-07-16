
import React from 'react';
import type { Photo } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import { Spinner } from './ui.tsx';
import { X } from 'lucide-react';

interface PhotoViewerModalProps {
  photo: Photo | null;
  onClose: () => void;
}

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
      <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center" onClick={onClose}>
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
          <div className="md:w-2/3 bg-black/90 flex items-center justify-center rounded-l-lg">
            <img src={photo.objectURL} alt="Enlarged view" className="max-w-full max-h-[90vh] md:max-h-[85vh] object-contain"/>
          </div>
          <div className="md:w-1/3 p-6 flex flex-col overflow-y-auto">
            <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full hover:bg-red-500 hover:text-white transition">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-lg font-bold mb-4">AI Predictions</h3>
            {photo.status === PhotoStatus.ANALYZED ? (
                <ul className="space-y-3">
                  {photo.predictions.length > 0 ? photo.predictions.map((p, i) => (
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
              <p className="text-xs text-gray-400 truncate" title={photo.id}>{photo.id}</p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default PhotoViewerModal;
