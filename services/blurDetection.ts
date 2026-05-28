
import { getTF } from './api.ts';

// Standard Laplacian Kernel for Edge Detection (Flattened for tensor4d)
const LAPLACIAN_KERNEL = [
  0, 1, 0,
  1, -4, 1,
  0, 1, 0
];

// Gaussian Kernel for Noise Reduction (Flattened for tensor4d)
const GAUSSIAN_KERNEL = [
  1/16, 2/16, 1/16,
  2/16, 4/16, 2/16,
  1/16, 2/16, 1/16
];

interface BlurResult {
  score: number; // 0-100 normalized
  raw: number;   // Raw variance
  level: 'sharp' | 'ok' | 'blurry';
}

interface BlurThresholds {
  blurry: number; // Below this is blurry
  sharp: number;  // Above this is sharp
}

export const detectBlur = async (imageElement: HTMLImageElement, thresholds: BlurThresholds = { blurry: 100, sharp: 300 }): Promise<BlurResult> => {
  const tf = await getTF();

  return tf.tidy(() => {
    // 1. Preprocessing: Convert to Tensor and Resize
    // We use a fixed width of 512px. This is crucial because variance
    // scales with image resolution. Standardizing size standardizes thresholds.
    let tensor = tf.browser.fromPixels(imageElement);
    const [height, width] = tensor.shape;

    const targetWidth = 512;
    const scaleFactor = targetWidth / width;
    const targetHeight = Math.round(height * scaleFactor);

    tensor = tf.image.resizeBilinear(tensor, [targetHeight, targetWidth]);

    // 2. Convert to Grayscale (Luminance)
    // Blur is a structural feature; color channels are redundant.
    // Mean across the 3rd axis (RGB) -> [height, width]
    let gray = tensor.mean(2);

    // Expand dims to [1, height, width, 1] for conv2d
    gray = gray.expandDims(0).expandDims(-1);

    // 3. Noise Reduction (Optional but recommended for high ISO images)
    // Apply a mild Gaussian blur to reduce grain, which can be mistaken for edges.
    const gaussianKernel = tf.tensor4d(GAUSSIAN_KERNEL, [3, 3, 1, 1]);
    gray = tf.conv2d(gray, gaussianKernel, 1, 'valid');

    // 4. Edge Detection (Laplacian)
    // Apply Laplacian kernel.
    const laplacianKernel = tf.tensor4d(LAPLACIAN_KERNEL, [3, 3, 1, 1]);
    const edges = tf.conv2d(gray, laplacianKernel, 1, 'valid');

    // 5. Center Cropping (Subject Isolation)
    // To handle bokeh/portrait mode, we only analyze the center 60% of the image.
    // If the subject is sharp but background is blurry, the whole-image variance drops.
    const [, eHeight, eWidth] = edges.shape;
    const cropH = Math.floor(eHeight * 0.6);
    const cropW = Math.floor(eWidth * 0.6);
    const startH = Math.floor((eHeight - cropH) / 2);
    const startW = Math.floor((eWidth - cropW) / 2);

    const centerEdges = tf.slice(edges, [0, startH, startW, 0], [1, cropH, cropW, 1]);

    // 6. Calculate Variance
    // Calculate moments (variance is the second moment).
    const { variance } = tf.moments(centerEdges);
    const rawVariance = variance.dataSync()[0];

    // 7. Normalization and Classification
    // Map raw variance to 0-100 score using a non-linear curve to give more granularity to the "ok" range.
    // We cap the "perfect" score at raw variance of 500 for normalization purposes.
    const normalizedScore = Math.min(100, Math.max(0, (rawVariance / 500) * 100));

    let level: 'sharp' | 'ok' | 'blurry';
    if (rawVariance < thresholds.blurry) level = 'blurry';
    else if (rawVariance > thresholds.sharp) level = 'sharp';
    else level = 'ok';

    return {
      score: Math.round(normalizedScore),
      raw: parseFloat(rawVariance.toFixed(2)),
      level
    };
  });
};
