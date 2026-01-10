
import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserProfile, Photo, FilterRule, Prediction, ModelsLoadState } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';
import * as api from '../services/api.ts';


export const usePhotoAnalysis = (
    photos: Map<string, Photo>,
    setPhotos: React.Dispatch<React.SetStateAction<Map<string, Photo>>>,
    userProfileRef: React.RefObject<UserProfile>,
    applyRules: (predictions: Prediction[], rules: FilterRule[]) => string[],
) => {
  const [tfBackend, setTfBackend] = useState<string | null>(null);
  const [modelsLoadState, setModelsLoadState] = useState<ModelsLoadState>({ classification: 'idle', detection: 'idle' });
  const analysisQueueRef = useRef<string[]>([]);
  const isAnalyzingRef = useRef<boolean>(false);
  const MAX_CONCURRENT_ANALYSES = 3; // To prevent browser from freezing

  // Preload models and subscribe to their loading status on mount
  useEffect(() => {
    api.preloadModels();
    const unsubscribe = api.subscribeToModelStatus(setModelsLoadState);
    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const analyzePhoto = useCallback(async (photoId: string) => {
    const photoToAnalyze = photos.get(photoId);
    if (!photoToAnalyze) return;

    // Immediately update status to ANALYZING in the UI
    setPhotos(prev => new Map(prev).set(photoId, { ...prev.get(photoId)!, status: PhotoStatus.ANALYZING }));

    try {
      // We need to fetch the full data binary for analysis.
      const fileBlob = await (await fetch(photoToAnalyze.objectURL)).blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(fileBlob);
      });

      // Extract metadata (Image object loading needed for dims)
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      const metadata = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: fileBlob.size,
        lastModified: 0 // File System Handle usually provides this, not the blob fetch directly here, but we can't easily access the handle here without passing it. Ignoring for now or defaulting.
      };

      const [classifications, detections, embedding] = await Promise.all([
        api.classifyImage(dataUrl),
        api.detectObjects(dataUrl),
        api.generateEmbedding(dataUrl)
      ]);

      if (!tfBackend) setTfBackend(api.getTfBackend());

      const threshold = userProfileRef.current?.unknownThreshold ?? 10;
      const isUncategorized = classifications.length === 0 || classifications.every(p => (p.score * 100) < threshold);

      let matchedCustomLabel: string | undefined = undefined;
      const customLabels = userProfileRef.current?.customLabels ?? [];
      if (customLabels.length > 0) {
        const allPhotoLabels = new Set([
          ...classifications.map(c => c.label.toLowerCase()),
          ...detections.map(d => d.label.toLowerCase())
        ]);

        for (const customLabel of customLabels) {
          if (customLabel.labels.some(l => allPhotoLabels.has(l))) {
            matchedCustomLabel = customLabel.name;
            break; // Found the first match
          }
        }
      }

      setPhotos(prev => {
        const newPhotos = new Map(prev);
        const currentPhoto = newPhotos.get(photoId);
        if (currentPhoto) {
          const finalStatus = isUncategorized ? PhotoStatus.UNCATEGORIZED : PhotoStatus.ANALYZED;
          const updatedPhoto: Photo = {
            ...currentPhoto,
            status: finalStatus,
            classifications,
            detections,
            embedding,
            metadata: { ...metadata, lastModified: Date.now() }, // Fallback timestamp
            customLabel: matchedCustomLabel,
          };

          if (updatedPhoto.status === PhotoStatus.ANALYZED && userProfileRef.current?.autoApplyRules) {
            const classificationMatches = applyRules(updatedPhoto.classifications, userProfileRef.current.classificationRules);
            const detectionMatches = applyRules(updatedPhoto.detections, userProfileRef.current.detectionRules);

            if (classificationMatches.length > 0 || detectionMatches.length > 0) {
              updatedPhoto.selected = true;
              updatedPhoto.matchedRules = {
                classification: classificationMatches,
                detection: detectionMatches,
              };
            }
          }
          newPhotos.set(photoId, updatedPhoto);
        }
        return newPhotos;
      });
    } catch (error) {
      console.error(`Failed to analyze ${photoId}:`, error);
      setPhotos(prev => new Map(prev).set(photoId, { ...prev.get(photoId)!, status: PhotoStatus.ERROR, classifications: [], detections: [] }));
    }
  }, [photos, setPhotos, tfBackend, userProfileRef, applyRules]);

  const processQueue = useCallback(async () => {
    if (analysisQueueRef.current.length === 0) {
      isAnalyzingRef.current = false;
      return;
    }

    isAnalyzingRef.current = true;
    const photoId = analysisQueueRef.current.shift();
    if (photoId) {
      await analyzePhoto(photoId);
    }

    // Process next item recursively
    processQueue();
  }, [analyzePhoto]);

  // Effect to manage the analysis queue
  useEffect(() => {
    const queuedPhotos = Array.from(photos.values())
        .filter(p => p.status === PhotoStatus.QUEUED)
        .map(p => p.id);

    if (queuedPhotos.length > 0) {
      analysisQueueRef.current.push(...queuedPhotos);
      // Mark them as "in queue" to avoid re-adding
      setPhotos(prev => {
        const newPhotos = new Map(prev);
        queuedPhotos.forEach(id => {
          const photo = newPhotos.get(id);
          // A bit of a hack: use a temporary status to prevent re-queueing
          // The analysis function will set it to ANALYZING properly.
          if (photo) newPhotos.set(id, {...photo, status: 'IN_QUEUE_INTERNAL' as any});
        });
        return newPhotos;
      });
    }

    // Start processing if not already running
    const activeWorkers = Array.from(photos.values()).filter(p => p.status === PhotoStatus.ANALYZING).length;
    const slotsToFill = MAX_CONCURRENT_ANALYSES - activeWorkers;

    for (let i = 0; i < slotsToFill; i++) {
      if (analysisQueueRef.current.length > 0) {
        processQueue();
      }
    }
  }, [photos, processQueue, setPhotos]);

  return { tfBackend, modelsLoadState };
};
