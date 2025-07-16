// --- File System Access API type definitions for browser compatibility ---
// This ensures TypeScript can compile features that are present in modern browsers
// but may not be in the default TypeScript library definitions.
declare global {
    interface Window {
        showDirectoryPicker(options?: any): Promise<FileSystemDirectoryHandle>;
    }

    interface FileSystemHandle {
        readonly kind: 'file' | 'directory';
        readonly name: string;
    }

    interface FileSystemFileHandle extends FileSystemHandle {
        readonly kind: 'file';
        getFile(): Promise<File>;
        createWritable(): Promise<FileSystemWritableFileStream>;
    }

    interface FileSystemDirectoryHandle extends FileSystemHandle {
        readonly kind: 'directory';
        getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
        getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
        removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
        resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
        values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
    }

    // This is a placeholder for FileSystemWritableFileStream to satisfy FileSystemFileHandle.
    // The app doesn't use its methods, so an empty interface is sufficient.
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface FileSystemWritableFileStream extends WritableStream {}
}
// --- End of File System Access API type definitions ---

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { UserProfile, Photo, FilterRule } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import * as api from '../services/api.ts';

// Helper to recursively delete a file by its relative path from a directory handle
async function deleteFileByPath(dirHandle: FileSystemDirectoryHandle, path: string): Promise<boolean> {
    const pathParts = path.split('/');
    const fileName = pathParts.pop();
    let currentDirHandle = dirHandle;

    if (!fileName) return false;

    try {
        // Navigate to the correct subdirectory
        for (const part of pathParts) {
            currentDirHandle = await currentDirHandle.getDirectoryHandle(part, { create: false });
        }
        await currentDirHandle.removeEntry(fileName);
        return true;
    } catch (error) {
        console.error(`Failed to delete file ${path}:`, error);
        return false;
    }
}

export const usePhotoManager = (userProfile: UserProfile) => {
    const [photos, setPhotos] = useState<Map<string, Photo>>(new Map());
    const [statusMessage, setStatusMessage] = useState<string>('Ready to sort some photos! 🥳');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [analysisProgress, setAnalysisProgress] = useState({ processed: 0, total: 0 });
    const [isApiSupported, setIsApiSupported] = useState(true);

    const directoryHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
    const photosRef = useRef(photos);
    const userProfileRef = useRef(userProfile);

    useEffect(() => {
        photosRef.current = photos;
    }, [photos]);

    useEffect(() => {
        userProfileRef.current = userProfile;
    }, [userProfile]);

    useEffect(() => {
        if (!window.showDirectoryPicker) {
            setIsApiSupported(false);
            setStatusMessage('Browser not supported. Use Chrome or Edge for directory access.');
            console.warn("File System Access API (`showDirectoryPicker`) is not supported in this browser.");
        }
    }, []);

    useEffect(() => {
        if (isLoading && analysisProgress.total > 0) {
            const { processed, total } = analysisProgress;
            if (total > 0 && processed < total) {
                setStatusMessage(`Analyzing... (${processed}/${total})`);
            } else if (processed === total && total > 0) {
                setIsLoading(false);
                setStatusMessage(`Analysis complete! ${total} photos ready. ✅`);
            }
        }
    }, [analysisProgress, isLoading]);

    const applyFilterRules = useCallback((photo: Photo, rules: FilterRule[]): boolean => {
        for (const rule of rules) {
            const photoPrediction = photo.predictions.find(p => p.label.toLowerCase().includes(rule.label.toLowerCase()));
            if (photoPrediction && (photoPrediction.score * 100) >= rule.confidence) {
                return true;
            }
        }
        return false;
    }, []);

    const analyzePhoto = useCallback(async (photoId: string, dataUrl: string) => {
        setPhotos(prev => new Map(prev).set(photoId, { ...prev.get(photoId)!, status: PhotoStatus.ANALYZING }));
        try {
            const predictions = await api.classifyImage(dataUrl);
            setPhotos(prev => {
                const newPhotos = new Map(prev);
                const currentPhoto = newPhotos.get(photoId);
                if (currentPhoto) {
                    const updatedPhoto = { ...currentPhoto, status: PhotoStatus.ANALYZED, predictions };

                    if (userProfileRef.current.autoApplyRules) {
                        const matchesRule = applyFilterRules(updatedPhoto, userProfileRef.current.rules);
                        if (matchesRule) {
                            updatedPhoto.selected = true;
                        }
                    }
                    newPhotos.set(photoId, updatedPhoto);
                }
                return newPhotos;
            });
        } catch (error) {
            console.error(`Failed to analyze ${photoId}:`, error);
            setPhotos(prev => new Map(prev).set(photoId, { ...prev.get(photoId)!, status: PhotoStatus.ERROR }));
        } finally {
            setAnalysisProgress(prev => ({ ...prev, processed: prev.processed + 1 }));
        }
    }, [applyFilterRules]);

    const handleLoadPhotos = useCallback(async () => {
        if (!isApiSupported) {
            console.warn("Attempted to load photos, but the File System Access API is not supported.");
            return;
        }
        try {
            const handle = await window.showDirectoryPicker();
            directoryHandleRef.current = handle;

            setIsLoading(true);
            setStatusMessage('Scanning directory...');
            setPhotos(new Map());

            const filesToProcess: {path: string, handle: FileSystemFileHandle}[] = [];

            async function getFilesRecursively(dirHandle: FileSystemDirectoryHandle, path: string) {
                for await (const entry of dirHandle.values()) {
                    const newPath = path ? `${path}/${entry.name}` : entry.name;
                    if (entry.kind === 'file' && entry.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                        filesToProcess.push({path: newPath, handle: entry});
                    } else if (entry.kind === 'directory') {
                        await getFilesRecursively(entry, newPath);
                    }
                }
            }
            await getFilesRecursively(handle, '');

            if (filesToProcess.length === 0) {
                setStatusMessage('No photos found in this directory. Try another one!');
                setIsLoading(false);
                return;
            }

            setStatusMessage(`Found ${filesToProcess.length} photos. Loading previews...`);
            setAnalysisProgress({ processed: 0, total: filesToProcess.length });

            const tempPhotosMap = new Map<string, Photo>();
            for(const {path, handle} of filesToProcess) {
                const file = await handle.getFile();
                const objectURL = URL.createObjectURL(file);
                tempPhotosMap.set(path, {
                    id: path,
                    binary: '', // Will be loaded on demand for analysis
                    objectURL,
                    status: PhotoStatus.QUEUED,
                    predictions: [],
                    selected: false,
                });
            }
            setPhotos(tempPhotosMap); // Add all photos at once for initial render

            // Start analysis asynchronously
            for(const {path, handle} of filesToProcess) {
                const file = await handle.getFile();
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result as string;
                    analyzePhoto(path, dataUrl);
                };
                reader.readAsDataURL(file);
            }

        } catch (error) {
            if ((error as DOMException).name === 'AbortError') {
                setStatusMessage('Directory selection cancelled.');
            } else {
                console.error('Error loading directory:', error);
                setStatusMessage('Could not load directory. Check console for details.');
            }
            setIsLoading(false);
        }
    }, [analyzePhoto, isApiSupported]);

    const handleSelectPhoto = useCallback((id: string) => {
        setPhotos(prev => {
            const newPhotos = new Map(prev);
            const photo = newPhotos.get(id);
            if (!photo) return newPhotos;

            newPhotos.set(id, { ...photo, selected: !photo.selected });
            return newPhotos;
        });
    }, []);

    const selectedPhotos = useMemo(() => Array.from(photos.values()).filter(p => p.selected), [photos]);

    const handleDeleteSelected = useCallback(async () => {
        if (selectedPhotos.length === 0 || !directoryHandleRef.current) return;
        const photosToDelete = [...selectedPhotos];

        const confirmation = window.confirm(`Are you sure you want to permanently delete ${photosToDelete.length} photo(s)? This action cannot be undone.`);
        if (!confirmation) return;

        setStatusMessage(`Deleting ${photosToDelete.length} photos...`);

        // Optimistically remove from UI
        const newPhotos = new Map(photosRef.current);
        photosToDelete.forEach(p => newPhotos.delete(p.id));
        setPhotos(newPhotos);

        let deletedCount = 0;
        await Promise.all(photosToDelete.map(async (p) => {
            const success = await deleteFileByPath(directoryHandleRef.current!, p.id);
            if (success) {
                URL.revokeObjectURL(p.objectURL); // Clean up blob URL
                deletedCount++;
            }
        }));

        if (deletedCount === photosToDelete.length) {
            setStatusMessage(`Successfully deleted ${deletedCount} photos. ✅`);
        } else {
            setStatusMessage(`Deleted ${deletedCount} of ${photosToDelete.length} photos. Some deletions failed.`);
            // Potentially add back photos that failed to delete, or prompt user to reload.
        }
    }, [selectedPhotos]);

    const handleApplyRulesManually = useCallback(() => {
        const photosToProcess = Array.from(photosRef.current.values()).filter(p => p.status === PhotoStatus.ANALYZED);
        if (photosToProcess.length === 0) {
            setStatusMessage("No analyzed photos to apply rules to.");
            return;
        }

        const photosToSelectIds: string[] = [];
        for (const photo of photosToProcess) {
            if (applyFilterRules(photo, userProfileRef.current.rules)) {
                photosToSelectIds.push(photo.id);
            }
        }

        if (photosToSelectIds.length === 0) {
            setStatusMessage("No photos matched your rules. ✨");
            return;
        }

        let newlySelectedCount = 0;
        const newPhotos = new Map(photosRef.current);

        photosToSelectIds.forEach(id => {
            const photo = newPhotos.get(id);
            if (photo && !photo.selected) {
                newPhotos.set(id, { ...photo, selected: true });
                newlySelectedCount++;
            }
        });

        setPhotos(newPhotos);

        if (newlySelectedCount > 0) {
            const s = newlySelectedCount === 1 ? '' : 's';
            setStatusMessage(`Selected ${newlySelectedCount} new photo${s} based on your rules.`);
        } else {
            const s = photosToSelectIds.length === 1 ? '' : 's';
            const were = photosToSelectIds.length === 1 ? 'was' : 'were';
            setStatusMessage(`All ${photosToSelectIds.length} photo${s} matching your rules ${were} already selected.`);
        }
    }, [applyFilterRules]);

    const handleSelectAll = useCallback(() => {
        const photosToSelect = Array.from(photosRef.current.values()).filter(p => p.status === PhotoStatus.ANALYZED);
        if (photosToSelect.length === 0) {
            setStatusMessage("No analyzed photos to select.");
            return;
        }

        let newlySelectedCount = 0;
        const newPhotos = new Map(photosRef.current);

        photosToSelect.forEach(photo => {
            if (!photo.selected) {
                newPhotos.set(photo.id, { ...photo, selected: true });
                newlySelectedCount++;
            }
        });

        setPhotos(newPhotos);

        if (newlySelectedCount > 0) {
            const s = newlySelectedCount === 1 ? '' : 's';
            setStatusMessage(`Selected ${newlySelectedCount} new photo${s}.`);
        } else {
            setStatusMessage("All analyzed photos were already selected.");
        }
    }, []);

    const handleClearSelection = useCallback(() => {
        const photosToClear = Array.from(photosRef.current.values()).filter(p => p.selected);
        if (photosToClear.length === 0) {
            setStatusMessage("No photos are currently selected.");
            return;
        }

        const newPhotos = new Map(photosRef.current);
        photosToClear.forEach(photo => {
            newPhotos.set(photo.id, { ...photo, selected: false });
        });

        setPhotos(newPhotos);
        const s = photosToClear.length === 1 ? '' : 's';
        setStatusMessage(`Cleared selection of ${photosToClear.length} photo${s}.`);
    }, []);

    return {
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
    };
};