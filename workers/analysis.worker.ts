
// Web Worker for TF.js image analysis
// Runs classification, object detection, embedding, and blur detection off the main thread

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-webgl';

let mobilenetModel: any = null;
let cocoSsdModel: any = null;
let isInitialized = false;
let backendName = '';

// Set WASM as preferred backend for workers (WebGL may not be available)
async function initialize() {
  if (isInitialized) return;

  try {
    // Try WebGL first (some browsers support it via OffscreenCanvas)
    await tf.setBackend('webgl');
    backendName = 'WEBGL';
  } catch {
    // Fall back to WASM (most compatible in workers)
    try {
      await tf.setBackend('wasm');
      backendName = 'WASM';
    } catch {
      // Final fallback to CPU
      await tf.setBackend('cpu');
      backendName = 'CPU';
    }
  }

  await tf.ready();

  // Load models in parallel
  const mobilenet = await import('@tensorflow-models/mobilenet');
  const cocoSsd = await import('@tensorflow-models/coco-ssd');

  [mobilenetModel, cocoSsdModel] = await Promise.all([
    mobilenet.load(),
    cocoSsd.load(),
  ]);

  isInitialized = true;
}

// Decode data URL to ImageBitmap (worker-safe alternative to new Image())
async function dataUrlToImageBitmap(dataUrl: string): Promise<ImageBitmap> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

// Blur detection logic (pure TF tensor ops, no DOM)
function detectBlur(tfInstance: any, bitmap: ImageBitmap, blurThreshold: number, sharpThreshold: number) {
  return tfInstance.tidy(() => {
    let tensor = tfInstance.browser.fromPixels(bitmap);
    const [height, width] = tensor.shape;

    const targetWidth = 512;
    const scale = targetWidth / width;
    const targetHeight = Math.round(height * scale);

    tensor = tfInstance.image.resizeBilinear(tensor, [targetHeight, targetWidth]);

    // Grayscale
    let gray = tensor.mean(2);
    gray = gray.expandDims(0).expandDims(-1);

    // Gaussian blur (noise reduction)
    const gaussianKernel = tfInstance.tensor4d(
      [1/16, 2/16, 1/16, 2/16, 4/16, 2/16, 1/16, 2/16, 1/16],
      [3, 3, 1, 1]
    );
    gray = tfInstance.conv2d(gray, gaussianKernel, 1, 'valid');

    // Laplacian edge detection
    const laplacianKernel = tfInstance.tensor4d(
      [0, 1, 0, 1, -4, 1, 0, 1, 0],
      [3, 3, 1, 1]
    );
    const edges = tfInstance.conv2d(gray, laplacianKernel, 1, 'valid');

    // Center crop 60%
    const [, eHeight, eWidth] = edges.shape;
    const cropH = Math.floor(eHeight * 0.6);
    const cropW = Math.floor(eWidth * 0.6);
    const startH = Math.floor((eHeight - cropH) / 2);
    const startW = Math.floor((eWidth - cropW) / 2);
    const centerEdges = tfInstance.slice(edges, [0, startH, startW, 0], [1, cropH, cropW, 1]);

    const { variance } = tfInstance.moments(centerEdges);
    const rawVariance = variance.dataSync()[0];

    const normalizedScore = Math.min(100, Math.max(0, (rawVariance / 500) * 100));

    let level: 'sharp' | 'ok' | 'blurry';
    if (rawVariance < blurThreshold) level = 'blurry';
    else if (rawVariance > sharpThreshold) level = 'sharp';
    else level = 'ok';

    return {
      score: Math.round(normalizedScore),
      raw: parseFloat(rawVariance.toFixed(2)),
      level
    };
  });
}

interface AnalysisResult {
  photoId: string;
  classifications: Array<{ label: string; score: number }>;
  detections: Array<{ label: string; score: number }>;
  embedding: number[];
  blurScore: number;
  blurRaw: number;
  blurLevel: 'sharp' | 'ok' | 'blurry';
  metadata: { width: number; height: number };
}

// Handle incoming messages
self.onmessage = async (event: MessageEvent) => {
  const msg = event.data;

  try {
    switch (msg.type) {
      case 'initialize': {
        await initialize();
        self.postMessage({ type: 'initialized', backend: backendName });
        break;
      }

      case 'analyze': {
        if (!isInitialized) {
          await initialize();
        }

        const { photoId, dataUrl, blurThreshold = 100, sharpThreshold = 300 } = msg;

        // Decode image once for all analysis tasks
        const bitmap = await dataUrlToImageBitmap(dataUrl);
        const metadata = { width: bitmap.width, height: bitmap.height };

        // Run all 4 analyses
        const [classifications, detections, embedding, blurResult] = await Promise.all([
          (async () => {
            const preds = await mobilenetModel.classify(bitmap);
            return preds.map((p: any) => ({
              label: p.className.split(', ')[0],
              score: p.probability,
            }));
          })(),
          (async () => {
            const dets = await cocoSsdModel.detect(bitmap);
            return dets.map((d: any) => ({
              label: d.class,
              score: d.score,
            }));
          })(),
          (async () => {
            const embeddingTensor = mobilenetModel.infer(bitmap, true);
            const data = await embeddingTensor.data();
            embeddingTensor.dispose();
            return Array.from(data) as number[];
          })(),
          Promise.resolve(detectBlur(tf, bitmap, blurThreshold, sharpThreshold)),
        ]);

        // Close bitmap to free memory
        bitmap.close();

        self.postMessage({
          type: 'result',
          photoId,
          classifications,
          detections,
          embedding,
          blurScore: blurResult.score,
          blurRaw: blurResult.raw,
          blurLevel: blurResult.level,
          metadata,
        } satisfies { type: string; photoId: string } & AnalysisResult);
        break;
      }

      case 'terminate': {
        // Dispose models and close
        if (mobilenetModel) mobilenetModel.dispose?.();
        if (cocoSsdModel) cocoSsdModel.dispose?.();
        self.close();
        break;
      }
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
      photoId: msg?.photoId,
    });
  }
};
