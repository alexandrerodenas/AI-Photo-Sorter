import type { Prediction, ModelsLoadState, ModelLoadStatus } from './types.ts';

// TensorFlow and its models will be loaded dynamically.
let classificationModelPromise: Promise<any> | null = null;
let detectionModelPromise: Promise<any> | null = null;
let backendName: string | null = null;
let tf: any = null;
let cocoSsd: any = null;
let mobilenet: any = null;

// --- Model Status Tracking ---
const modelStatus: ModelsLoadState = {
  classification: 'idle',
  detection: 'idle',
};
const subscribers = new Set<(status: ModelsLoadState) => void>();

const updateStatus = (model: keyof ModelsLoadState, status: ModelLoadStatus) => {
  if (modelStatus[model] !== status) {
    modelStatus[model] = status;
    notifySubscribers();
  }
};

const notifySubscribers = () => {
  // Notify with a copy to prevent mutation issues
  subscribers.forEach(callback => callback({ ...modelStatus }));
};

export const subscribeToModelStatus = (callback: (status: ModelsLoadState) => void) => {
  subscribers.add(callback);
  callback({ ...modelStatus }); // Immediately notify with the current status
  // The returned cleanup function for useEffect must not return a value.
  // An arrow function with curly braces `{}` implicitly returns `undefined`.
  return () => {
    subscribers.delete(callback);
  };
};
// --- End Model Status Tracking ---

// Exported function to get the backend name after it's been initialized.
export const getTfBackend = (): string | null => backendName;

const initializeTf = async () => {
  if (tf) return;
  console.log('Dynamically loading TensorFlow.js and models...');

  // Load main libraries dynamically and in parallel
  [tf, cocoSsd, mobilenet] = await Promise.all([
    import('@tensorflow/tfjs'),
    import('@tensorflow-models/coco-ssd'),
    import('@tensorflow-models/mobilenet')
  ]);

  // Load backends
  await import('@tensorflow/tfjs-backend-webgpu');
  await import('@tensorflow/tfjs-backend-wasm');
  await import('@tensorflow/tfjs-backend-webgl');

  try {
    await tf.setBackend('webgpu');
    console.log('Using WebGPU backend for TensorFlow.js');
  } catch (e) {
    console.warn('WebGPU backend not available, falling back to WASM.', e);
    try {
      await tf.setBackend('wasm');
      console.log('Using WASM backend for TensorFlow.js');
    } catch (e2) {
      console.warn('WASM backend not available, falling back to WebGL.', e2);
      await tf.setBackend('webgl');
    }
  }

  await tf.ready();
  backendName = tf.getBackend()?.toUpperCase();
  console.log(`TensorFlow.js backend ready (${backendName}).`);
}

const getClassificationModel = () => {
  if (!classificationModelPromise) {
    classificationModelPromise = (async () => {
      try {
        updateStatus('classification', 'loading');
        await initializeTf();
        console.log(`Loading MobileNet classification model...`);
        const model = await mobilenet.load();
        console.log('MobileNet model loaded successfully.');
        updateStatus('classification', 'loaded');
        return model;
      } catch (error) {
        console.error('Failed to load classification model:', error);
        updateStatus('classification', 'error');
        throw error;
      }
    })();
  }
  return classificationModelPromise;
};

const getDetectionModel = () => {
  if (!detectionModelPromise) {
    detectionModelPromise = (async () => {
      try {
        updateStatus('detection', 'loading');
        await initializeTf();
        console.log('Loading COCO-SSD object detection model...');
        const model = await cocoSsd.load();
        console.log('COCO-SSD model loaded successfully.');
        updateStatus('detection', 'loaded');
        return model;
      } catch (error) {
        console.error('Failed to load detection model:', error);
        updateStatus('detection', 'error');
        throw error;
      }
    })();
  }
  return detectionModelPromise;
}

export const preloadModels = () => {
  console.log('Preloading AI models...');
  getClassificationModel();
  getDetectionModel();
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

// This function runs image classification using TensorFlow.js and MobileNet
export const classifyImage = async (dataUrl: string): Promise<Prediction[]> => {
  try {
    const model = await getClassificationModel();
    const imageElement = await createImageElement(dataUrl);

    const predictions = await model.classify(imageElement);

    return predictions.map((p: { className: string, probability: number }) => ({
      label: p.className.split(', ')[0], // Get primary label
      score: p.probability,
    }));

  } catch (error) {
    console.error('Error during image classification with MobileNet:', error);
    throw error; // Re-throw to be caught by the caller
  }
};

// This function runs object detection using COCO-SSD
export const detectObjects = async (dataUrl: string): Promise<Prediction[]> => {
  try {
    const model = await getDetectionModel();
    const imageElement = await createImageElement(dataUrl);

    const detections = await model.detect(imageElement);

    return detections.map((detection: { class: string; score: number }) => ({
      label: detection.class,
      score: detection.score,
    }));
  } catch (error) {
    console.error('Error during object detection with COCO-SSD:', error);
    throw error;
  }
}