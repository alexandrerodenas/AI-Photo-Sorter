import type { Prediction } from '../types.ts';
import * as tf from '@tensorflow/tfjs';
// By importing the backends, they are registered with tfjs, making tf.setBackend available.
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import * as mobilenet from '@tensorflow-models/mobilenet';

// A singleton promise to ensure the model is loaded only once.
let modelPromise: Promise<mobilenet.MobileNet> | null = null;

const getModel = () => {
  if (!modelPromise) {
    // We create an async block to correctly initialize the model.
    // This ensures that we first set the backend and then load the model, avoiding race conditions.
    modelPromise = (async () => {
      try {
        await tf.setBackend('wasm');
        console.log('Using WASM backend for TensorFlow.js');
      } catch (e) {
        console.log('WASM backend not available, falling back to WebGL.');
        await tf.setBackend('webgl');
      }
      return mobilenet.load();
    })();
  }
  return modelPromise;
};

// Helper function to create an Image element from a data URL
const createImageElement = (dataUrl: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = dataUrl;
    });
};

// This function now runs image classification using TensorFlow.js and MobileNet
export const classifyImage = async (dataUrl: string): Promise<Prediction[]> => {
  const model = await getModel();
  const imageElement = await createImageElement(dataUrl);

  try {
    const tfPredictions = await model.classify(imageElement);
    // The output format is { className: string, probability: number }
    // We need to map it to our Prediction type: { label: string, score: number }
    return tfPredictions.map(p => ({
      label: p.className.split(', ')[0], // Get the primary label
      score: p.probability,
    }));
  } catch (error) {
    console.error('Error during image classification:', error);
    throw error; // Re-throw to be caught by the caller
  }
};
