
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { UserProfile, Photo, FilterRule } from '../types';
import { PhotoStatus } from '../types';
import * as api from '../services/api';

export const usePhotoManager = (userProfile: UserProfile) => {
    const [photos, setPhotos] = useState<Map<string, Photo>>(new Map());
    const [directoryPath, setDirectoryPath] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('Ready to sort some photos! 🥳');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const photosRef = useRef(photos);
    const userProfileRef = useRef(userProfile);

    useEffect(() => {
        photosRef.current = photos;
    }, [photos]);

    useEffect(() => {
        userProfileRef.current = userProfile;
    }, [userProfile]);

    const applyFilterRules = useCallback((photo: Photo, rules: FilterRule[]): boolean => {
        for (const rule of rules) {
            const photoPrediction = photo.predictions.find(p => p.label.toLowerCase().includes(rule.label.toLowerCase()));
            if (photoPrediction && (photoPrediction.score * 100) >= rule.confidence) {
                return true;
            }
        }
        return false;
    }, []);

    const analyzePhoto = useCallback(async (photoId: string, base64: string) => {
        setPhotos(prev => new Map(prev).set(photoId, { ...prev.get(photoId)!, status: PhotoStatus.ANALYZING }));
        try {
            const predictions = await api.detectObjects(base64);
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
        }
    }, [applyFilterRules]);

    const handleLoadPhotos = useCallback(async () => {
        if (!directoryPath) {
            setStatusMessage('Please provide a directory path first.');
            return;
        }
        setIsLoading(true);
        setStatusMessage('Connecting and checking directory...');

        try {
            const { count } = await api.checkPhotoDirectory(directoryPath);
            if (count === 0) {
                setStatusMessage('No photos found in this directory. Try another one!');
                setIsLoading(false);
                return;
            }

            let loadedCount = 0;
            setPhotos(new Map()); // Clear previous photos
            setStatusMessage(`Found ${count} photos. Starting stream...`);

            const onPhotoReceived = (data: { path: string; binary: string }) => {
                loadedCount++;

                if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
                streamTimeoutRef.current = setTimeout(() => {
                    setStatusMessage(`Analysis complete! ${photosRef.current.size} photos ready. ✅`);
                    setIsLoading(false);
                }, 3000);

                setStatusMessage(`Loading & Analyzing... (${loadedCount}/${count})`);

                const objectURL = URL.createObjectURL(api.base64ToBlob(data.binary));
                const newPhoto: Photo = {
                    id: data.path,
                    binary: data.binary,
                    objectURL,
                    status: PhotoStatus.QUEUED,
                    predictions: [],
                    selected: false,
                };

                setPhotos(prev => new Map(prev).set(data.path, newPhoto));
                analyzePhoto(data.path, data.binary);
            };

            api.streamPhotos(
                directoryPath,
                onPhotoReceived,
                (error) => {
                    console.error('Socket error:', error);
                    setStatusMessage(`Error during stream: ${error.message}`);
                    setIsLoading(false);
                },
                () => setStatusMessage('Connected to backend, waiting for photos...'),
            );

        } catch (error) {
            setStatusMessage((error as Error).message);
            setIsLoading(false);
        }
    }, [directoryPath, analyzePhoto]);

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

    const handleDeleteSelected = async () => {
        if (selectedPhotos.length === 0) return;
        const photosToDelete = [...selectedPhotos];

        setStatusMessage(`Deleting ${photosToDelete.length} photos...`);
        setPhotos(prev => {
            const newPhotos = new Map(prev);
            photosToDelete.forEach(p => newPhotos.delete(p.id));
            return newPhotos;
        });

        try {
            await Promise.all(photosToDelete.map(p => api.deletePhoto(p.id)));
            setStatusMessage(`Successfully deleted ${photosToDelete.length} photos. ✅`);
        } catch(error) {
            console.error(error);
            setStatusMessage(`Error deleting some photos. Please check console.`);
        }
    };

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
        directoryPath,
        setDirectoryPath,
        statusMessage,
        isLoading,
        handleLoadPhotos,
        handleSelectPhoto,
        selectedPhotos,
        handleDeleteSelected,
        handleApplyRulesManually,
        handleSelectAll,
        handleClearSelection,
    };
};
