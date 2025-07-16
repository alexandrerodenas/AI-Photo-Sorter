import type { Prediction } from './types.ts';
import type { MobileNet } from '@tensorflow-models/mobilenet';

// A singleton promise to ensure the model is loaded only once.
let modelPromise: Promise<MobileNet> | null = null;
let backendName: string | null = null;

// Exported function to get the backend name after it's been initialized.
export const getTfBackend = (): string | null => backendName;

const getModel = () => {
  if (!modelPromise) {
    // We create an async block to dynamically import and initialize the model.
    // This ensures TF.js and its modules are only loaded when needed,
    // preventing load-time errors from crashing the entire app.
    modelPromise = (async () => {
      console.log('Dynamically loading TensorFlow.js and MobileNet...');
      const tf = await import('@tensorflow/tfjs');
      // Dynamically import backends to register them
      await import('@tensorflow/tfjs-backend-wasm');
      await import('@tensorflow/tfjs-backend-webgl');
      const mobilenet = await import('@tensorflow-models/mobilenet');

      try {
        await tf.setBackend('wasm');
        console.log('Using WASM backend for TensorFlow.js');
      } catch (e) {
        console.warn('WASM backend not available, falling back to WebGL.', e);
        await tf.setBackend('webgl');
      }

      // Wait for the backend to be fully initialized.
      await tf.ready();
      // Capture the backend name so it can be displayed in the UI.
      backendName = tf.getBackend()?.toUpperCase();

      console.log(`TensorFlow.js backend ready (${backendName}). Loading MobileNet model...`);
      const model = await mobilenet.load();
      console.log('MobileNet model loaded successfully.');
      return model;
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
  try {
    const model = await getModel();
    const imageElement = await createImageElement(dataUrl);
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