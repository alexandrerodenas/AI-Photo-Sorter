import React, { useMemo } from 'react';
import type { UserProfile, ModelsLoadState } from '../services/types.ts';
import {
  FolderOpen,
  Trash2,
  Filter,
  Search,
  Zap,
  Settings2,
  CheckSquare,
  XSquare,
  Eye,
  EyeOff,
  Wand2,
  PlusCircle,
} from 'lucide-react';
import { Spinner } from './ui.tsx';
import AutocompleteInput from './AutocompleteInput.tsx';
import ModelLoadingIndicator from "./ModelLoadingIndicator.tsx";

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
  tfBackend: string | null;
  isolateSelection: boolean;
  onToggleIsolateSelection: () => void;
  allAvailableLabels: string[];
  modelsLoadState: ModelsLoadState;
  onCreateRuleFromSelection: () => void;
  onCreateRuleFromFilter: (label: string) => void;
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
                                                                 noAnalyzedPhotos,
                                                                 tfBackend,
                                                                 isolateSelection,
                                                                 onToggleIsolateSelection,
                                                                 allAvailableLabels,
                                                                 modelsLoadState,
                                                                 onCreateRuleFromSelection,
                                                                 onCreateRuleFromFilter,
                                                               }) => {

  const existingRuleLabels = useMemo(() => new Set([
    ...userProfile.classificationRules.map(r => r.label.toLowerCase()),
    ...userProfile.detectionRules.map(r => r.label.toLowerCase()),
  ]), [userProfile.classificationRules, userProfile.detectionRules]);

  const trimmedFilterLabel = filterLabel.trim();
  const showCreateRuleButton = trimmedFilterLabel && !existingRuleLabels.has(trimmedFilterLabel.toLowerCase());

  return (
      <aside className="w-80 bg-white dark:bg-gray-800 p-6 flex flex-col shadow-lg shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo.png" alt="Pixo Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold tracking-tight">Pixo</h1>
        </div>

        <div
            role="button"
            tabIndex={0}
            aria-label="Open profile settings"
            onClick={onOpenProfileSettings}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenProfileSettings()}
            className="flex items-center justify-between gap-3 mb-8 p-3 bg-gray-100 dark:bg-gray-700/60 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-primary text-white flex items-center justify-center rounded-full font-bold text-lg shrink-0">
              {userProfile.firstName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-gray-800 dark:text-gray-100 truncate" title={userProfile.firstName}>{userProfile.firstName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">View settings</p>
            </div>
          </div>
          <Settings2 className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" />
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
          <AutocompleteInput
              icon={<Search />}
              placeholder="e.g., cat, dog, car..."
              value={filterLabel}
              onChange={onFilterChange}
              suggestions={allAvailableLabels}
          />
          {showCreateRuleButton && (
              <button
                  onClick={() => onCreateRuleFromFilter(filterLabel)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
                  title={`Create new rules for "${trimmedFilterLabel}"`}
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">Create Rule for "{trimmedFilterLabel}"</span>
              </button>
          )}
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
          <button
              onClick={onCreateRuleFromSelection}
              disabled={selectedPhotoCount === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent-dark transition disabled:bg-gray-400/50 disabled:text-white/80 disabled:cursor-not-allowed"
              title={selectedPhotoCount > 0 ? "Create new rules from selected photos" : "Select photos to create rules from"}
          >
            <Wand2 className="w-5 h-5"/> Create Rule from Selection
          </button>
          <button
              onClick={onToggleIsolateSelection}
              disabled={selectedPhotoCount === 0 && !isolateSelection}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition disabled:bg-gray-400/50 disabled:text-white/80 disabled:cursor-not-allowed"
              title={isolateSelection ? "Show all photos" : "Show only selected photos"}
          >
            {isolateSelection ? (
                <>
                  <Eye className="w-5 h-5"/> Show All
                </>
            ) : (
                <>
                  <EyeOff className="w-5 h-5"/> Isolate Selection
                </>
            )}
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

          <ModelLoadingIndicator status={modelsLoadState} />

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md text-center space-y-1">
            <p>{statusMessage}</p>
            {tfBackend && (
                <p className="font-mono text-gray-400 dark:text-gray-500 text-[10px] tracking-wider pt-1 border-t border-gray-200 dark:border-gray-600/50 mt-1">
                  AI Backend: {tfBackend}
                </p>
            )}
          </div>
        </div>
      </aside>
  );
};

export default PhotoSorterSidebar;