import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { UserProfile, Photo, FilterRule, Prediction } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import { useFileSystem } from './useFileSystem.ts';
import { usePhotoAnalysis } from './usePhotoAnalysis.ts';
import { usePhotoSelection } from './usePhotoSelection.ts';


interface UsePhotoManagerProps {
    userProfile: UserProfile;
    onProfileUpdate: (profile: UserProfile) => void;
    filterLabel: string;
}

export const usePhotoManager = ({ userProfile, onProfileUpdate, filterLabel }: UsePhotoManagerProps) => {
    const [photos, setPhotos] = useState<Map<string, Photo>>(new Map());
    const [statusMessage, setStatusMessage] = useState<string>('Ready to organize some photos! 🥳');
    const [confirmDeleteState, setConfirmDeleteState] = useState<{isOpen: boolean, photosToDelete: Photo[]}>({ isOpen: false, photosToDelete: [] });

    const directoryHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
    const userProfileRef = useRef(userProfile);
    userProfileRef.current = userProfile;

    // --- Sub-hook for Selection Logic ---
    const {
        selectedPhotos,
        isolateSelection,
        handleSelectPhoto,
        handleToggleIsolateSelection,
        selectAllFiltered,
        clearSelectionFiltered
    } = usePhotoSelection(photos, setPhotos, setStatusMessage);

    const [isolateSaved, setIsolateSaved] = useState(false);
    const savedPhotos = useMemo(() => Array.from(photos.values()).filter(p => p.isSaved), [photos]);

    const processingQueueCount = useMemo(() => {
        let count = 0;
        for (const photo of photos.values()) {
            if (photo.status === PhotoStatus.QUEUED || photo.status === PhotoStatus.ANALYZING) {
                count++;
            }
        }
        return count;
    }, [photos]);

    // --- Sub-hook for File System Logic ---
    const {
        isLoading,
        isApiSupported,
        handleLoadPhotos,
        handleDeletePhotos,
        handleMoveSaved
    } = useFileSystem(directoryHandleRef, photos, selectedPhotos, setPhotos, setStatusMessage);

    // --- Rule Application Logic ---
    const applyRules = useCallback((predictions: Prediction[], rules: FilterRule[]): boolean => {
        if (!rules || rules.length === 0) return false;
        for (const rule of rules) {
            const photoPrediction = predictions.find(p => p.label.toLowerCase().includes(rule.label.toLowerCase()));
            if (photoPrediction) {
                if (rule.confidence === undefined || (photoPrediction.score * 100) >= rule.confidence) {
                    return true;
                }
            }
        }
        return false;
    }, []);

    // --- Sub-hook for Analysis Logic ---
    const {
        tfBackend,
        modelsLoadState,
    } = usePhotoAnalysis(photos, setPhotos, userProfileRef, applyRules, setStatusMessage);

    // --- Derived State ---
    const { allAvailableClassificationLabels, allAvailableDetectionLabels, allAvailableLabels } = useMemo(() => {
        const classificationLabels = new Set<string>();
        const detectionLabels = new Set<string>();
        for (const photo of photos.values()) {
            if (photo.status === PhotoStatus.ANALYZED || photo.status === PhotoStatus.UNCATEGORIZED) {
                photo.classifications.forEach(c => classificationLabels.add(c.label.toLowerCase()));
                photo.detections.forEach(d => detectionLabels.add(d.label.toLowerCase()));
            }
        }
        const customLabelNames = (userProfile.customLabels ?? []).map(cl => cl.name.toLowerCase());
        const allLabels = new Set([...classificationLabels, ...detectionLabels, ...customLabelNames]);

        return {
            allAvailableClassificationLabels: Array.from(classificationLabels).sort(),
            allAvailableDetectionLabels: Array.from(detectionLabels).sort(),
            allAvailableLabels: Array.from(allLabels).sort()
        };
    }, [photos, userProfile.customLabels]);

    const handleToggleSavePhoto = useCallback((id: string) => {
        setPhotos(prev => {
            const newPhotos = new Map(prev);
            const photo = newPhotos.get(id);
            if (photo) {
                newPhotos.set(id, { ...photo, isSaved: !photo.isSaved });
            }
            return newPhotos;
        });
    }, [setPhotos]);

    const handleBulkSave = useCallback((photosToSave: Photo[]) => {
        if (photosToSave.length === 0) return;

        // If all photos are already saved, unsave all. Otherwise, save all.
        const allAreSaved = photosToSave.every(p => p.isSaved);

        setPhotos(prev => {
            const newPhotos = new Map(prev);
            photosToSave.forEach(photo => {
                const current = newPhotos.get(photo.id);
                if (current) {
                    newPhotos.set(photo.id, { ...current, isSaved: !allAreSaved });
                }
            });
            return newPhotos;
        });

        setStatusMessage(`${allAreSaved ? 'Unsaved' : 'Saved'} ${photosToSave.length} photo(s).`);
    }, [setPhotos, setStatusMessage]);

    const handleToggleIsolateSaved = useCallback(() => {
        if (savedPhotos.length > 0 || isolateSaved) {
            setIsolateSaved(prev => !prev);
        }
    }, [savedPhotos.length, isolateSaved]);

    const handleMoveSavedPhotos = useCallback(() => {
        handleMoveSaved(savedPhotos, userProfileRef.current.savedFolderName || 'Pixo Saved');
    }, [savedPhotos, userProfileRef, handleMoveSaved]);

    const handleRequestDelete = useCallback((photos: Photo[] = selectedPhotos) => {
        if (photos.length === 0) return;

        const savedInSelection = photos.filter(p => p.isSaved);

        if (savedInSelection.length > 0) {
            setConfirmDeleteState({ isOpen: true, photosToDelete: photos });
        } else {
            // No saved photos in selection, ask for simple confirmation
            if (window.confirm(`Are you sure you want to permanently delete ${photos.length} photo(s)? This action cannot be undone.`)) {
                handleDeletePhotos(photos);
            }
        }
    }, [selectedPhotos, handleDeletePhotos]);

    const handleConfirmDelete = useCallback(() => {
        handleDeletePhotos(confirmDeleteState.photosToDelete);
        setConfirmDeleteState({ isOpen: false, photosToDelete: [] });
    }, [confirmDeleteState.photosToDelete, handleDeletePhotos]);

    const handleConfirmDeleteKeepSaved = useCallback(() => {
        const photosToDelete = confirmDeleteState.photosToDelete.filter(p => !p.isSaved);
        if (photosToDelete.length > 0) {
            handleDeletePhotos(photosToDelete);
        }
        setConfirmDeleteState({ isOpen: false, photosToDelete: [] });
    }, [confirmDeleteState.photosToDelete, handleDeletePhotos]);

    const handleCancelDelete = useCallback(() => {
        setConfirmDeleteState({ isOpen: false, photosToDelete: [] });
    }, []);


    // --- High-level Handlers (combining selection and business logic) ---
    const handleSelectAll = useCallback(() => {
        let photosToProcess = Array.from(photos.values()).filter(p => p.status === PhotoStatus.ANALYZED);
        if (filterLabel.trim()) {
            const lowercasedFilter = filterLabel.toLowerCase().trim();
            photosToProcess = photosToProcess.filter(p =>
                p.classifications.some(pred => pred.label.toLowerCase().includes(lowercasedFilter)) ||
                p.detections.some(pred => pred.label.toLowerCase().includes(lowercasedFilter))
            );
        }
        selectAllFiltered(photosToProcess);
    }, [photos, filterLabel, selectAllFiltered]);

    const handleClearSelection = useCallback(() => {
        let photosToClear = selectedPhotos;
        if (filterLabel.trim()) {
            const lowercasedFilter = filterLabel.toLowerCase().trim();
            photosToClear = photosToClear.filter(p =>
                p.status === PhotoStatus.ANALYZED &&
                (p.classifications.some(pred => pred.label.toLowerCase().includes(lowercasedFilter)) ||
                    p.detections.some(pred => pred.label.toLowerCase().includes(lowercasedFilter)))
            );
        }
        clearSelectionFiltered(photosToClear);
    }, [selectedPhotos, filterLabel, clearSelectionFiltered]);

    const handleApplyRulesManually = useCallback(() => {
        const photosToProcess = Array.from(photos.values()).filter(p => p.status === PhotoStatus.ANALYZED);
        if (photosToProcess.length === 0) {
            setStatusMessage("No analyzed photos to apply rules to.");
            return;
        }
        const photosToSelect: Photo[] = [];
        for (const photo of photosToProcess) {
            const classificationMatches = applyRules(photo.classifications, userProfileRef.current.classificationRules);
            const detectionMatches = applyRules(photo.detections, userProfileRef.current.detectionRules);
            if (classificationMatches || detectionMatches) {
                photosToSelect.push(photo);
            }
        }
        selectAllFiltered(photosToSelect, { isManualApplication: true });
    }, [photos, applyRules, selectAllFiltered]);

    const handleCreateRuleFromSelection = useCallback(() => {
        if (selectedPhotos.length === 0) {
            setStatusMessage("Please select photos to create rules from.");
            return;
        }

        let newClassificationRules: FilterRule[] = [];
        let newDetectionRules: FilterRule[] = [];

        const existingClassificationLabels = new Set(userProfileRef.current.classificationRules.map(r => r.label.toLowerCase()));
        const existingDetectionLabels = new Set(userProfileRef.current.detectionRules.map(r => r.label.toLowerCase()));

        if (selectedPhotos.length === 1) {
            const photo = selectedPhotos[0];
            if (photo.classifications.length > 0) {
                const topClassification = photo.classifications.reduce((max, p) => p.score > max.score ? p : max);
                if (!existingClassificationLabels.has(topClassification.label.toLowerCase())) {
                    newClassificationRules.push({
                        id: `${Date.now()}-c-${topClassification.label}`,
                        label: topClassification.label,
                        confidence: Math.max(1, Math.floor(topClassification.score * 100)),
                    });
                }
            }
            if (photo.detections.length > 0) {
                const topDetection = photo.detections.reduce((max, p) => p.score > max.score ? p : max);
                if (!existingDetectionLabels.has(topDetection.label.toLowerCase())) {
                    newDetectionRules.push({
                        id: `${Date.now()}-d-${topDetection.label}`,
                        label: topDetection.label,
                        confidence: Math.max(1, Math.floor(topDetection.score * 100)),
                    });
                }
            }
        } else {
            const commonClassifications = new Map<string, { score: number; originalLabel: string }>(
                selectedPhotos[0].classifications.map(p => [ p.label.toLowerCase(), { score: p.score, originalLabel: p.label }])
            );
            const commonDetections = new Map<string, { score: number; originalLabel: string }>(
                selectedPhotos[0].detections.map(p => [ p.label.toLowerCase(), { score: p.score, originalLabel: p.label }])
            );

            for (let i = 1; i < selectedPhotos.length; i++) {
                const photo = selectedPhotos[i];
                const photoClassifications = new Map(photo.classifications.map(p => [p.label.toLowerCase(), p.score]));
                const photoDetections = new Map(photo.detections.map(p => [p.label.toLowerCase(), p.score]));
                for (const [labelKey, data] of commonClassifications.entries()) {
                    if (photoClassifications.has(labelKey)) {
                        data.score = Math.min(data.score, photoClassifications.get(labelKey)!);
                    } else {
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
            setStatusMessage("No new rules created. Common labels may already have rules.");
            return;
        }

        const updatedProfile: UserProfile = {
            ...userProfileRef.current,
            classificationRules: [...userProfileRef.current.classificationRules, ...newClassificationRules],
            detectionRules: [...userProfileRef.current.detectionRules, ...newDetectionRules],
        };
        onProfileUpdate(updatedProfile);
        const totalNewRules = newClassificationRules.length + newDetectionRules.length;
        setStatusMessage(`Added ${totalNewRules} new smart rule(s) from your selection.`);
    }, [selectedPhotos, onProfileUpdate, setStatusMessage]);

    const handleCreateRuleFromFilter = useCallback((label: string) => {
        const trimmedLabel = label.trim();
        if (!trimmedLabel) return;
        const lowercasedLabel = trimmedLabel.toLowerCase();

        const currentProfile = userProfileRef.current;
        const newProfile = { ...currentProfile, classificationRules: [...currentProfile.classificationRules], detectionRules: [...currentProfile.detectionRules]};
        let ruleAdded = false;

        const hasClassificationRule = currentProfile.classificationRules.some(r => r.label.toLowerCase() === lowercasedLabel);
        if (!hasClassificationRule) {
            newProfile.classificationRules.push({ id: `${Date.now()}-c-${trimmedLabel}`, label: trimmedLabel });
            ruleAdded = true;
        }

        const hasDetectionRule = currentProfile.detectionRules.some(r => r.label.toLowerCase() === lowercasedLabel);
        if (!hasDetectionRule) {
            newProfile.detectionRules.push({ id: `${Date.now()}-d-${trimmedLabel}`, label: trimmedLabel });
            ruleAdded = true;
        }

        if (ruleAdded) {
            onProfileUpdate(newProfile);
            setStatusMessage(`Created new rule for "${trimmedLabel}" (any confidence).`);
        } else {
            setStatusMessage(`Rule for "${trimmedLabel}" already exists.`);
        }
    }, [onProfileUpdate, setStatusMessage]);

    return {
        photos,
        statusMessage,
        isLoading,
        isApiSupported,
        handleLoadPhotos,
        handleSelectPhoto,
        selectedPhotos,
        savedPhotos,
        handleRequestDelete,
        handleApplyRulesManually,
        handleSelectAll,
        handleClearSelection,
        tfBackend,
        isolateSelection,
        handleToggleIsolateSelection,
        isolateSaved,
        handleToggleIsolateSaved,
        allAvailableLabels,
        allAvailableClassificationLabels,
        allAvailableDetectionLabels,
        modelsLoadState,
        handleCreateRuleFromSelection,
        handleCreateRuleFromFilter,
        handleToggleSavePhoto,
        handleMoveSavedPhotos,
        confirmDeleteState,
        handleConfirmDelete,
        handleConfirmDeleteKeepSaved,
        handleCancelDelete,
        processingQueueCount,
        handleBulkSave,
    };
};