

import React, { useState, useMemo, useCallback } from 'react';
import type { UserProfile, Photo, FilterRule } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import { usePhotoManager } from '../hooks/usePhotoManager.ts';

import PhotoSorterSidebar from './PhotoSorterSidebar.tsx';
import PhotoContent from './PhotoContent.tsx';
import PhotoViewerModal from './PhotoViewerModal.tsx';
import ProfileSettingsModal from './ProfileSettingsModal.tsx';

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
    isolateSelection,
    handleToggleIsolateSelection,
    tfBackend,
    allAvailableLabels,
    allAvailableClassificationLabels,
    allAvailableDetectionLabels,
    modelsLoadState,
    setStatusMessage,
  } = usePhotoManager(userProfile);

  const [filterLabel, setFilterLabel] = useState<string>('');
  const [isProfileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);

  const noAnalyzedPhotos = useMemo(() =>
          Array.from(photos.values()).every(p => p.status !== PhotoStatus.ANALYZED),
      [photos]);

  const handleCreateRuleFromSelection = useCallback(() => {
    if (selectedPhotos.length === 0) {
      setStatusMessage("Please select photos to create rules from.");
      return;
    }

    let newClassificationRules: FilterRule[] = [];
    let newDetectionRules: FilterRule[] = [];

    const existingClassificationLabels = new Set(userProfile.classificationRules.map(r => r.label.toLowerCase()));
    const existingDetectionLabels = new Set(userProfile.detectionRules.map(r => r.label.toLowerCase()));

    // Logic for a single selected photo: create rules from primary labels
    if (selectedPhotos.length === 1) {
      const photo = selectedPhotos[0];

      if (photo.classifications.length > 0) {
        const topClassification = photo.classifications.reduce((max, p) => p.score > max.score ? p : max);
        const labelKey = topClassification.label.toLowerCase();
        if (!existingClassificationLabels.has(labelKey)) {
          newClassificationRules.push({
            id: `${Date.now()}-c-${labelKey}`,
            label: topClassification.label,
            confidence: Math.max(1, Math.floor(topClassification.score * 100)),
          });
        }
      }
      if (photo.detections.length > 0) {
        const topDetection = photo.detections.reduce((max, p) => p.score > max.score ? p : max);
        const labelKey = topDetection.label.toLowerCase();
        if (!existingDetectionLabels.has(labelKey)) {
          newDetectionRules.push({
            id: `${Date.now()}-d-${labelKey}`,
            label: topDetection.label,
            confidence: Math.max(1, Math.floor(topDetection.score * 100)),
          });
        }
      }
    }
    // Logic for multiple selected photos: find common labels and minimum confidence
    else {
      const firstPhoto = selectedPhotos[0];

      // Initialize with all labels from the first photo
      const commonClassifications = new Map<string, { score: number; originalLabel: string }>(
          firstPhoto.classifications.map(p => [ p.label.toLowerCase(), { score: p.score, originalLabel: p.label }])
      );
      const commonDetections = new Map<string, { score: number; originalLabel: string }>(
          firstPhoto.detections.map(p => [ p.label.toLowerCase(), { score: p.score, originalLabel: p.label }])
      );

      // Intersect with subsequent photos to find common labels
      for (let i = 1; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const photoClassifications = new Map(photo.classifications.map(p => [p.label.toLowerCase(), p.score]));
        const photoDetections = new Map(photo.detections.map(p => [p.label.toLowerCase(), p.score]));

        for (const [labelKey, data] of commonClassifications.entries()) {
          if (photoClassifications.has(labelKey)) {
            // Update score to the minimum seen so far
            data.score = Math.min(data.score, photoClassifications.get(labelKey)!);
          } else {
            // Label not in this photo, so it's not common to all
            commonClassifications.delete(labelKey);
          }
        }

        for (const [labelKey, data] of commonDetections.entries()) {
          if (photoDetections.has(labelKey)) {
            data.score = Math.min(data.score, photoDetections.get(labelKey)!);
          } else {
            commonDetections.delete(labelKey);
          }
        }
      }

      // Create rules from the common labels found
      for (const [labelKey, data] of commonClassifications.entries()) {
        if (!existingClassificationLabels.has(labelKey)) {
          newClassificationRules.push({
            id: `${Date.now()}-c-${labelKey}`,
            label: data.originalLabel,
            confidence: Math.max(1, Math.floor(data.score * 100)),
          });
        }
      }
      for (const [labelKey, data] of commonDetections.entries()) {
        if (!existingDetectionLabels.has(labelKey)) {
          newDetectionRules.push({
            id: `${Date.now()}-d-${labelKey}`,
            label: data.originalLabel,
            confidence: Math.max(1, Math.floor(data.score * 100)),
          });
        }
      }
    }

    if (newClassificationRules.length === 0 && newDetectionRules.length === 0) {
      setStatusMessage("No new rules created. Common labels may already have rules, or no common labels were found.");
      return;
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      classificationRules: [...userProfile.classificationRules, ...newClassificationRules],
      detectionRules: [...userProfile.detectionRules, ...newDetectionRules],
    };

    onProfileUpdate(updatedProfile);

    const totalNewRules = newClassificationRules.length + newDetectionRules.length;
    const s = totalNewRules === 1 ? '' : 's';
    const context = selectedPhotos.length > 1 ? "common content" : "primary content";
    setStatusMessage(`Added ${totalNewRules} new smart rule${s} based on the ${context} of your selection.`);
  }, [selectedPhotos, userProfile, onProfileUpdate, setStatusMessage]);

  const handleCreateRuleFromFilter = useCallback((label: string) => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;

    const lowercasedLabel = trimmedLabel.toLowerCase();

    const newProfile = { ...userProfile, classificationRules: [...userProfile.classificationRules], detectionRules: [...userProfile.detectionRules]};
    let ruleAdded = false;

    const hasClassificationRule = userProfile.classificationRules.some(r => r.label.toLowerCase() === lowercasedLabel);
    if (!hasClassificationRule) {
      const newRule: FilterRule = {
        id: `${Date.now()}-c-${trimmedLabel}`,
        label: trimmedLabel,
        confidence: 1,
      };
      newProfile.classificationRules.push(newRule);
      ruleAdded = true;
    }

    const hasDetectionRule = userProfile.detectionRules.some(r => r.label.toLowerCase() === lowercasedLabel);
    if (!hasDetectionRule) {
      const newRule: FilterRule = {
        id: `${Date.now()}-d-${trimmedLabel}`,
        label: trimmedLabel,
        confidence: 1,
      };
      newProfile.detectionRules.push(newRule);
      ruleAdded = true;
    }

    if (ruleAdded) {
      onProfileUpdate(newProfile);
      setStatusMessage(`Created new rule for "${trimmedLabel}" at 1% confidence.`);
      setFilterLabel(''); // Clear the input for better UX
    } else {
      setStatusMessage(`Rule for "${trimmedLabel}" already exists.`);
    }
  }, [userProfile, onProfileUpdate, setStatusMessage]);

  return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <PhotoSorterSidebar
            userProfile={userProfile}
            onOpenProfileSettings={() => setProfileModalOpen(true)}
            onLoadPhotos={handleLoadPhotos}
            isLoading={isLoading}
            isApiSupported={isApiSupported}
            filterLabel={filterLabel}
            onFilterChange={setFilterLabel}
            onSelectAll={() => handleSelectAll(filterLabel)}
            onClearSelection={() => handleClearSelection(filterLabel)}
            onApplyRules={handleApplyRulesManually}
            onDeleteSelected={handleDeleteSelected}
            selectedPhotoCount={selectedPhotos.length}
            totalPhotoCount={photos.size}
            statusMessage={statusMessage}
            noAnalyzedPhotos={noAnalyzedPhotos}
            tfBackend={tfBackend}
            isolateSelection={isolateSelection}
            onToggleIsolateSelection={handleToggleIsolateSelection}
            allAvailableLabels={allAvailableLabels}
            modelsLoadState={modelsLoadState}
            onCreateRuleFromSelection={handleCreateRuleFromSelection}
            onCreateRuleFromFilter={handleCreateRuleFromFilter}
        />

        <PhotoContent
            photos={photos}
            isLoading={isLoading}
            filterLabel={filterLabel}
            onFilterChange={setFilterLabel}
            onSelectPhoto={handleSelectPhoto}
            onViewPhoto={setViewingPhoto}
            isolateSelection={isolateSelection}
            thumbnailSize={userProfile.thumbnailSize ?? 'M'}
        />

        <PhotoViewerModal
            photo={viewingPhoto}
            onClose={() => setViewingPhoto(null)}
        />

        <ProfileSettingsModal
            isOpen={isProfileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            userProfile={userProfile}
            onSave={onProfileUpdate}
            allAvailableClassificationLabels={allAvailableClassificationLabels}
            allAvailableDetectionLabels={allAvailableDetectionLabels}
        />
      </div>
  );
};

export default PhotoSorter;