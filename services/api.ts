
import type { Prediction } from '../types';

const BACKEND_URL = 'http://localhost:5000';

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
