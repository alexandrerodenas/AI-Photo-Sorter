import { useState, useEffect, useCallback } from 'react';
import type { Photo } from '../services/types.ts';
import { PhotoStatus } from '../services/types.ts';

// Helper to recursively delete a file by its relative path from a directory handle
async function deleteFileByPath(dirHandle: FileSystemDirectoryHandle, path: string): Promise<boolean> {
  const pathParts = path.split('/');
  const fileName = pathParts.pop();
  if (!fileName) return false;

  try {
    let currentDirHandle = dirHandle;
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


export const useFileSystem = (
    directoryHandleRef: React.MutableRefObject<FileSystemDirectoryHandle | null>,
    photos: Map<string, Photo>,
    selectedPhotos: Photo[],
    setPhotos: React.Dispatch<React.SetStateAction<Map<string, Photo>>>,
    setStatusMessage: (message: string) => void
) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApiSupported, setIsApiSupported] = useState<boolean>(true);

  // Check for API support on mount
  useEffect(() => {
    if (!(window as any).showDirectoryPicker) {
      setIsApiSupported(false);
      setStatusMessage('Browser not supported. Use Chrome or Edge for directory access.');
      console.warn("File System Access API (`showDirectoryPicker`) is not supported in this browser.");
    }
  }, [setStatusMessage]);

  const handleLoadPhotos = useCallback(async () => {
    if (!isApiSupported) return;

    try {
      const handle = await (window as any).showDirectoryPicker();
      directoryHandleRef.current = handle;

      setIsLoading(true);
      setStatusMessage('Scanning directory...');
      setPhotos(new Map());

      const filesToProcess: { path: string, handle: FileSystemFileHandle }[] = [];
      async function getFilesRecursively(dirHandle: FileSystemDirectoryHandle, path: string) {
        for await (const entry of dirHandle.values()) {
          const newPath = path ? `${path}/${entry.name}` : entry.name;
          if (entry.kind === 'file' && entry.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            filesToProcess.push({ path: newPath, handle: entry as FileSystemFileHandle });
          } else if (entry.kind === 'directory') {
            await getFilesRecursively(entry as FileSystemDirectoryHandle, newPath);
          }
        }
      }
      await getFilesRecursively(handle, '');

      if (filesToProcess.length === 0) {
        setStatusMessage('No photos found in this directory. Try another one!');
        setIsLoading(false);
        return;
      }

      setStatusMessage(`Found ${filesToProcess.length} photos. Queuing for analysis...`);

      const tempPhotosMap = new Map<string, Photo>();
      // Use Promise.all to speed up file reading for previews
      await Promise.all(filesToProcess.map(async ({ path, handle }) => {
        const file = await handle.getFile();
        const objectURL = URL.createObjectURL(file);
        tempPhotosMap.set(path, {
          id: path,
          binary: '', // Will be loaded on demand for analysis
          objectURL,
          status: PhotoStatus.QUEUED,
          classifications: [],
          detections: [],
          selected: false,
        });
      }));

      setPhotos(tempPhotosMap); // Add all photos at once for initial render
      // The usePhotoAnalysis hook will pick up the 'QUEUED' photos.

    } catch (error) {
      if ((error as DOMException).name === 'AbortError') {
        setStatusMessage('Directory selection cancelled.');
      } else {
        console.error('Error loading directory:', error);
        setStatusMessage('Could not load directory. Check console for details.');
      }
      setIsLoading(false);
    }
  }, [isApiSupported, directoryHandleRef, setPhotos, setStatusMessage]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedPhotos.length === 0 || !directoryHandleRef.current) return;

    if (!window.confirm(`Are you sure you want to permanently delete ${selectedPhotos.length} photo(s)? This action cannot be undone.`)) {
      return;
    }

    setStatusMessage(`Deleting ${selectedPhotos.length} photos...`);

    // Optimistically remove from UI
    setPhotos(prevPhotos => {
      const newPhotos = new Map(prevPhotos);
      selectedPhotos.forEach(p => newPhotos.delete(p.id));
      return newPhotos;
    });

    let deletedCount = 0;
    await Promise.all(selectedPhotos.map(async (p) => {
      const success = await deleteFileByPath(directoryHandleRef.current!, p.id);
      if (success) {
        URL.revokeObjectURL(p.objectURL); // Clean up blob URL
        deletedCount++;
      }
    }));

    if (deletedCount < selectedPhotos.length) {
      setStatusMessage(`Deleted ${deletedCount} of ${selectedPhotos.length} photos. Some deletions failed.`);
      // Potentially add back photos that failed to delete, or prompt user to reload.
    } else {
      setStatusMessage(`Successfully deleted ${deletedCount} photos. ✅`);
    }
  }, [selectedPhotos, directoryHandleRef, setPhotos, setStatusMessage]);

  // This effect is to manage the global loading state based on analysis progress.
  // It's a bit of a grey area, but FileSystem is the "entry point" for loading.
  useEffect(() => {
    const photoArray = Array.from(photos.values());
    const total = photoArray.length;
    const processed = photoArray.filter(p => p.status !== PhotoStatus.QUEUED).length;

    if (total > 0 && processed === total && isLoading) {
      setIsLoading(false);
      setStatusMessage(`Analysis complete! ${total} photos ready. ✅`);
    } else if (isLoading && total > 0) {
      setStatusMessage(`Analyzing... (${processed}/${total})`);
    }

  }, [photos, isLoading, setStatusMessage]);


  return { isLoading, isApiSupported, handleLoadPhotos, handleDeleteSelected };
};