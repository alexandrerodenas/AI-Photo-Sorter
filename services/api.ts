import { io, Socket } from 'socket.io-client';
import type { Prediction } from '../types';

const BACKEND_URL = 'http://localhost:5000';

let socket: Socket | null = null;

export const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

export const detectObjects = async (base64Image: string): Promise<Prediction[]> => {
  const blob = base64ToBlob(base64Image);
  const file = new File([blob], "image.jpg", { type: 'image/jpeg' });
  
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BACKEND_URL}/detect`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to detect objects');
  }

  const predictions = await response.json();
  // Ensure score is a number between 0 and 1
  return predictions.map((p: any) => ({ ...p, score: p.score }));
};

export const deletePhoto = async (path: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/photos/${encodeURIComponent(path)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete photo');
  }
};

export const checkPhotoDirectory = async (directory: string): Promise<{count: number}> => {
    const response = await fetch(`${BACKEND_URL}/photos?directory=${encodeURIComponent(directory)}`);
    if(!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid directory');
    }
    return response.json();
}

export const streamPhotos = (
  directory: string,
  onPhoto: (data: { path: string, binary: string }) => void,
  onError: (error: { message: string }) => void,
  onConnect: () => void,
) => {
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(BACKEND_URL, {
    reconnection: false,
    transports: ['websocket']
  });

  socket.on('connect', () => {
    onConnect();
    socket?.emit('stream_photos', { directory });
  });
  
  socket.on('photo', onPhoto);
  socket.on('error', onError);

  socket.on('disconnect', () => {
     console.log('Socket disconnected.');
  });
  
  return () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };
};