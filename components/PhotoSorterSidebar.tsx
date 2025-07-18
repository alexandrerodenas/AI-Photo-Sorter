
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
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Spinner, AutoCompleteInput, Tooltip } from './ui.tsx';

interface SidebarButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title: string;
  isCollapsed: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ onClick, disabled, title, isCollapsed, icon, children, className }) => {
  const content = (
      <button
          onClick={onClick}
          disabled={disabled}
          className={`w-full flex items-center gap-3 px-4 py-2 font-semibold rounded-md transition ${className} ${isCollapsed ? 'justify-center' : ''}`}
      >
        {icon}
        <span className={`${isCollapsed ? 'sr-only' : 'inline'}`}>{children}</span>
      </button>
  );

  return isCollapsed ? <Tooltip content={title}>{content}</Tooltip> : <div title={title}>{content}</div>;
}


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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobileMenu: () => void;
}

const PhotoSorterSidebar: React.FC<PhotoSorterSidebarProps> = (props) => {
  const {
    userProfile, onOpenProfileSettings, onLoadPhotos, isLoading, isApiSupported,
    filterLabel, onFilterChange, onSelectAll, onClearSelection, onApplyRules,
    onDeleteSelected, selectedPhotoCount, totalPhotoCount, statusMessage,
    noAnalyzedPhotos, tfBackend, isolateSelection, onToggleIsolateSelection,
    allAvailableLabels, isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobileMenu
  } = props;

  return (
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        flex-shrink-0 flex flex-col
        bg-white dark:bg-gray-800 shadow-xl
        transform md:transform-none transition-all duration-300
        ${isCollapsed ? 'md:w-20' : 'w-80'}
        ${isMobileOpen ? 'translate-x-0 w-80' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'md:justify-center md:w-full' : ''}`}>
              <Sparkles className="w-8 h-8 text-primary shrink-0" />
              <span className={`text-2xl font-bold whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'md:opacity-0 md:w-0' : 'opacity-100'}`}>Photo Sorter</span>
            </div>
            <button onClick={onCloseMobileMenu} className="p-2 md:hidden text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile */}
          <div className={`flex items-center gap-3 mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg transition-all duration-300 ${isCollapsed ? 'md:p-0 md:bg-transparent md:dark:bg-transparent md:justify-center' : ''}`}>
            <div className={`w-10 h-10 bg-primary/20 text-primary flex items-center justify-center rounded-full shrink-0 ${isCollapsed ? 'md:w-12 md:h-12' : ''}`}>
              <User className="w-6 h-6" />
            </div>
            <div className={`${isCollapsed ? 'md:hidden' : ''}`}>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back,</p>
              <p className="font-bold text-lg">{userProfile.firstName}! 😊</p>
            </div>
            <Tooltip content="Profile & Settings">
              <button onClick={onOpenProfileSettings} className={`ml-auto p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition ${isCollapsed ? 'md:hidden' : ''}`}>
                <Settings2 className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>

          {/* Directory Loader */}
          <div className="mb-6">
            {!isCollapsed && <label className="font-semibold mb-2 flex items-center gap-2"><FolderOpen className="w-5 h-5 text-secondary" /> Load Photos</label>}
            <SidebarButton
                onClick={onLoadPhotos}
                disabled={isLoading || !isApiSupported}
                title={!isApiSupported ? "Your browser is not supported for this feature." : "Select a directory to load photos"}
                isCollapsed={isCollapsed}
                icon={isLoading ? <Spinner className="w-5 h-5"/> : <FolderOpen className="w-5 h-5" />}
                className="bg-primary text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Select Directory'}
            </SidebarButton>
          </div>

          {/* Filters */}
          <div className="mb-6">
            {!isCollapsed && <label className="font-semibold mb-2 flex items-center gap-2"><Filter className="w-5 h-5 text-secondary" /> Filter by Label</label>}
            <div className={`relative ${isCollapsed ? 'hidden' : 'block'}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <AutoCompleteInput
                  value={filterLabel}
                  onChange={onFilterChange}
                  suggestions={allAvailableLabels}
                  placeholder="e.g., cat, dog, car..."
                  inputClassName="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className={`grid gap-2 ${isCollapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <SidebarButton
                  onClick={onSelectAll}
                  disabled={isLoading || noAnalyzedPhotos}
                  title={noAnalyzedPhotos && !isLoading ? "No analyzed photos to select" : "Select all analyzed photos"}
                  isCollapsed={isCollapsed}
                  icon={<CheckSquare className="w-4 h-4" />}
                  className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-400/30 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Select All
              </SidebarButton>
              <SidebarButton
                  onClick={onClearSelection}
                  disabled={selectedPhotoCount === 0}
                  title="Clear current selection"
                  isCollapsed={isCollapsed}
                  icon={<XSquare className="w-4 h-4" />}
                  className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-400/30 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Clear All
              </SidebarButton>
            </div>
            <SidebarButton
                onClick={onApplyRules}
                disabled={isLoading || noAnalyzedPhotos}
                title={noAnalyzedPhotos && !isLoading ? "No analyzed photos to apply rules to" : "Apply custom rules to all analyzed photos"}
                isCollapsed={isCollapsed}
                icon={<Zap className="w-5 h-5"/>}
                className="bg-secondary text-white hover:bg-secondary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Apply Manual Rules
            </SidebarButton>
            <SidebarButton
                onClick={onToggleIsolateSelection}
                disabled={selectedPhotoCount === 0 && !isolateSelection}
                title={isolateSelection ? "Show all photos" : "Show only selected photos"}
                isCollapsed={isCollapsed}
                icon={isolateSelection ? <Eye className="w-5 h-5"/> : <EyeOff className="w-5 h-5"/>}
                className="bg-accent text-white hover:bg-accent-dark disabled:bg-gray-400/50 disabled:text-white/80 disabled:cursor-not-allowed"
            >
              {isolateSelection ? 'Show All' : 'Isolate Selection'}
            </SidebarButton>
            <SidebarButton
                onClick={onDeleteSelected}
                disabled={selectedPhotoCount === 0}
                title="Delete selected photos"
                isCollapsed={isCollapsed}
                icon={<Trash2 className="w-5 h-5"/>}
                className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400/50 disabled:cursor-not-allowed"
            >
              Delete Selected ({selectedPhotoCount})
            </SidebarButton>
          </div>

          {/* Counters & Status */}
          <div className={`mt-auto pt-6 border-t border-gray-200 dark:border-gray-700 transition-all ${isCollapsed ? 'md:hidden' : ''}`}>
            <div className="flex justify-between items-center text-sm font-medium mb-2">
              <span>Total Photos</span>
              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full">{totalPhotoCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium">
              <span>Selected</span>
              <span className="px-2 py-0.5 bg-accent/20 text-accent rounded-full">{selectedPhotoCount}</span>
            </div>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md text-center space-y-1">
              <p>{statusMessage}</p>
              {tfBackend && (
                  <p className="font-mono text-gray-400 dark:text-gray-500 text-[10px] tracking-wider pt-1 border-t border-gray-200 dark:border-gray-600/50 mt-1">
                    AI Backend: {tfBackend}
                  </p>
              )}
            </div>
          </div>
        </div>

        {/* Collapse Toggle */}
        <div className="hidden md:flex justify-center items-center p-2 border-t border-gray-200 dark:border-gray-700">
          <Tooltip content={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
            <button onClick={onToggleCollapse} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </Tooltip>
        </div>
      </aside>
  );
};

export default PhotoSorterSidebar;