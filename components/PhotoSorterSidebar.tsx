
import React from 'react';
import type { UserProfile } from '../services/types.ts';
import {
  FolderOpen,
  Trash2,
  User,
  Filter,
  Search,
  Zap,
  Sparkles,
  Settings2,
  CheckSquare,
  XSquare,
} from 'lucide-react';
import { Spinner } from './ui.tsx';

interface PhotoSorterSidebarProps {
  userProfile: UserProfile;
  onOpenProfileSettings: () => void;
  onLoadPhotos: () => void;
  isLoading: boolean;
  isApiSupported: boolean;
  filterLabel: string;
  onFilterChange: (value: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onApplyRules: () => void;
  onDeleteSelected: () => void;
  selectedPhotoCount: number;
  totalPhotoCount: number;
  statusMessage: string;
  noAnalyzedPhotos: boolean;
}

const PhotoSorterSidebar: React.FC<PhotoSorterSidebarProps> = ({
                                                                 userProfile,
                                                                 onOpenProfileSettings,
                                                                 onLoadPhotos,
                                                                 isLoading,
                                                                 isApiSupported,
                                                                 filterLabel,
                                                                 onFilterChange,
                                                                 onSelectAll,
                                                                 onClearSelection,
                                                                 onApplyRules,
                                                                 onDeleteSelected,
                                                                 selectedPhotoCount,
                                                                 totalPhotoCount,
                                                                 statusMessage,
                                                                 noAnalyzedPhotos
                                                               }) => {
  return (
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
          <button onClick={onOpenProfileSettings} className="ml-auto p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        {/* Directory Loader */}
        <div className="mb-6">
          <label className="font-semibold mb-2 flex items-center gap-2"><FolderOpen className="w-5 h-5 text-secondary" /> Load Photos</label>
          <div className="flex gap-2">
            <button
                onClick={onLoadPhotos}
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
            <input type="text" value={filterLabel} onChange={(e) => onFilterChange(e.target.value)} placeholder="e.g., cat, dog, car..." className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition"/>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
                onClick={onSelectAll}
                disabled={isLoading || noAnalyzedPhotos}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:bg-gray-400/30 disabled:text-gray-500 disabled:cursor-not-allowed"
                title={noAnalyzedPhotos && !isLoading ? "No analyzed photos to select" : "Select all analyzed photos"}
            >
              <CheckSquare className="w-4 h-4" /> Select All
            </button>
            <button
                onClick={onClearSelection}
                disabled={selectedPhotoCount === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:bg-gray-400/30 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <XSquare className="w-4 h-4" /> Clear All
            </button>
          </div>
          <button
              onClick={onApplyRules}
              disabled={isLoading || noAnalyzedPhotos}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary-dark transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              title={noAnalyzedPhotos && !isLoading ? "No analyzed photos to apply rules to" : "Apply custom rules to all analyzed photos"}
          >
            <Zap className="w-5 h-5"/> Apply Manual Rules
          </button>
          <button onClick={onDeleteSelected} disabled={selectedPhotoCount === 0} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition disabled:bg-red-400/50 disabled:cursor-not-allowed">
            <Trash2 className="w-5 h-5"/> Delete Selected ({selectedPhotoCount})
          </button>
        </div>

        {/* Counters & Status */}
        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm font-medium mb-2">
            <span>Total Photos</span>
            <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full">{totalPhotoCount}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium">
            <span>Selected</span>
            <span className="px-2 py-0.5 bg-accent/20 text-accent rounded-full">{selectedPhotoCount}</span>
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md text-center">
            <p>{statusMessage}</p>
          </div>
        </div>
      </aside>
  );
};

export default PhotoSorterSidebar;
