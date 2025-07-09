
import type { Prediction } from '../types';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs'; // Necessary to initialize the backend

// A singleton promise to ensure the model is loaded only once.
let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;

const getModel = (): Promise<cocoSsd.ObjectDetection> => {
  if (!modelPromise) {
    // Load the COCO-SSD model.
    modelPromise = cocoSsd.load();
  }
  return modelPromise;
};

// This function now runs the object detection model directly in the browser.
export const detectObjects = async (base64Image: string): Promise<Prediction[]> => {
  const model = await getModel();

  // Create an Image element from the base64 string
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64Image}`;

    img.onload = async () => {
      try {
        const predictions = await model.detect(img);
        // Map the model's output to the application's Prediction type
        resolve(predictions.map(p => ({
          label: p.class,
          score: p.score,
        })));
      } catch (error) {
        console.error('Error during object detection:', error);
        reject(error);
      }
    };

    img.onerror = () => {
      const errorMessage = 'Failed to load image for detection.';
      console.error(errorMessage);
      reject(new Error(errorMessage));
    };
  });
};
