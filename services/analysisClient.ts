
// Client-side interface for the analysis Web Worker
// Manages worker lifecycle, message passing, and cleanup

type ErrorCallback = (error: string, photoId?: string) => void;

let worker: Worker | null = null;
let isWorkerSupported = typeof Worker !== 'undefined';
let isInitialized = false;
let pendingResolve: Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }> = new Map();
let initPromise: Promise<void> | null = null;
let errorSubscriber: ErrorCallback | null = null;

function createWorker(): Worker | null {
  if (!isWorkerSupported) return null;
  try {
    return new Worker(new URL('../workers/analysis.worker.ts', import.meta.url), { type: 'module' });
  } catch (e) {
    console.warn('Failed to create analysis worker, falling back to main thread:', e);
    isWorkerSupported = false;
    return null;
  }
}

function handleWorkerMessage(event: MessageEvent) {
  const msg = event.data;

  switch (msg.type) {
    case 'initialized':
      isInitialized = true;
      break;

    case 'result': {
      const pending = pendingResolve.get(msg.photoId);
      if (pending) {
        pendingResolve.delete(msg.photoId);
        pending.resolve(msg);
      }
      break;
    }

    case 'error': {
      const pending = pendingResolve.get(msg.photoId);
      if (pending) {
        pendingResolve.delete(msg.photoId);
        pending.reject(new Error(msg.error));
      }
      // Notify error subscriber
      errorSubscriber?.(msg.error, msg.photoId);
      break;
    }
  }
}

function handleWorkerError(event: ErrorEvent) {
  console.error('Analysis worker error:', event.message);
  errorSubscriber?.(event.message);
}

export async function ensureWorkerInitialized(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  if (!worker) {
    worker = createWorker();
    if (!worker) {
      initPromise = Promise.reject(new Error('Workers not supported'));
      return initPromise;
    }
    worker.onmessage = handleWorkerMessage;
    worker.onerror = handleWorkerError;
  }

  initPromise = new Promise<void>((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      if (event.data.type === 'initialized') {
        worker!.removeEventListener('message', handler as any);
        isInitialized = true;
        resolve();
      }
    };
    worker!.addEventListener('message', handler as any);

    // Timeout after 30s
    setTimeout(() => {
      worker!.removeEventListener('message', handler as any);
      reject(new Error('Worker initialization timed out'));
    }, 30000);

    worker!.postMessage({ type: 'initialize' });
  });

  return initPromise;
}

export interface AnalyzeOptions {
  dataUrl: string;
  photoId: string;
  blurThreshold?: number;
  sharpThreshold?: number;
}

export function analyzePhoto(options: AnalyzeOptions): Promise<any> {
  return new Promise(async (resolve, reject) => {
    if (!worker || !isWorkerSupported) {
      reject(new Error('Worker not available'));
      return;
    }

    // Ensure worker is initialized
    try {
      await ensureWorkerInitialized();
    } catch (e) {
      reject(e);
      return;
    }

    const { photoId } = options;

    // Store pending promise
    pendingResolve.set(photoId, { resolve, reject });

    // Send analysis request
    worker.postMessage({
      type: 'analyze',
      ...options,
    });
  });
}

export function onAnalysisError(callback: ErrorCallback) {
  errorSubscriber = callback;
}

export function terminateWorker() {
  if (worker) {
    worker.postMessage({ type: 'terminate' });
    worker.terminate();
    worker = null;
  }
  isInitialized = false;
  initPromise = null;
  pendingResolve.clear();
}

export function isWorkerActive(): boolean {
  return worker !== null && isInitialized;
}
