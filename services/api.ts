
import type { Prediction, ModelsLoadState, ModelLoadStatus } from './types.ts';
import { detectBlur } from './blurDetection.ts';
import { analyzePhoto as workerAnalyzePhoto, ensureWorkerInitialized } from './analysisClient.ts';

export { detectBlur }; // Re-export for consumption

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

  // Also try to initialize the Web Worker in the background
  ensureWorkerInitialized().catch(() => {
    console.log('Web Worker not available, using main thread for analysis.');
  });
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

// Generates a 1024-dim embedding vector using MobileNet's internal layer
export const generateEmbedding = async (dataUrl: string): Promise<number[]> => {
  try {
    const model = await getClassificationModel();
    const imageElement = await createImageElement(dataUrl);

    // Use infer(img, true) to get the embedding instead of classification
    const embeddingTensor = model.infer(imageElement, true);
    const data = await embeddingTensor.data();
    embeddingTensor.dispose(); // Cleanup tensor memory immediately

    return Array.from(data);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
};

// Expose tf instance for advanced operations in services
export const getTF = async () => {
  await initializeTf();
  return tf;
}

// --- Worker-based batch analysis (falls back to main thread) ---

interface BatchAnalysisOptions {
  dataUrl: string;
  photoId: string;
  blurThreshold: number;
  sharpThreshold: number;
}

interface BatchAnalysisResult {
  photoId: string;
  classifications: Prediction[];
  detections: Prediction[];
  embedding: number[];
  blurScore: number;
  blurRaw: number;
  blurLevel: 'sharp' | 'ok' | 'blurry';
  metadata: {
    width: number;
    height: number;
  };
}

/**
 * Analyze a photo using all AI models.
 * Uses Web Worker if available, falls back to main thread.
 */
export const analyzePhotoBatch = async (options: BatchAnalysisOptions): Promise<BatchAnalysisResult> => {
  const { dataUrl, photoId, blurThreshold, sharpThreshold } = options;

  // Try Web Worker first
  if (typeof Worker !== 'undefined') {
    try {
      const result = await workerAnalyzePhoto({
        dataUrl,
        photoId,
        blurThreshold,
        sharpThreshold,
      });
      return result as BatchAnalysisResult;
    } catch (workerError) {
      console.warn('Worker analysis failed, falling back to main thread:', workerError);
      // Fall through to main thread
    }
  }

  // Main thread fallback
  const img = await createImageElement(dataUrl);

  const metadata = {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };

  const [classifications, detections, embedding, blurResult] = await Promise.all([
    classifyImage(dataUrl),
    detectObjects(dataUrl),
    generateEmbedding(dataUrl),
    detectBlur(img, { blurry: blurThreshold, sharp: sharpThreshold }),
  ]);

  return {
    photoId,
    classifications,
    detections,
    embedding,
    blurScore: blurResult.score,
    blurRaw: blurResult.raw,
    blurLevel: blurResult.level,
    metadata,
  };
};
