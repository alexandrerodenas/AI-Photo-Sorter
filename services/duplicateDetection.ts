
import { Photo, DuplicateGroup, PhotoStatus } from './types.js';
import { getTF } from './api.ts';

// Similarity threshold for considering two photos as duplicates
// 0.98 is very strict (near exact), 0.92 handles slight bursts/crops.
const DUPLICATE_THRESHOLD = 0.94;

export const findDuplicateGroups = async (photos: Photo[]): Promise<DuplicateGroup[]> => {
  const analyzedPhotos = photos.filter(p => p.status === PhotoStatus.ANALYZED && p.embedding && p.embedding.length > 0);

  if (analyzedPhotos.length < 2) return [];

  const tf = await getTF();

  return tf.tidy(() => {
    const count = analyzedPhotos.length;
    const embeddingSize = analyzedPhotos[0].embedding!.length;

    // 1. Create a Tensor of all embeddings [N, 1024]
    // Flatten the arrays
    const flatEmbeddings = new Float32Array(count * embeddingSize);
    analyzedPhotos.forEach((p, i) => {
      flatEmbeddings.set(p.embedding!, i * embeddingSize);
    });

    const embeddingMatrix = tf.tensor2d(flatEmbeddings, [count, embeddingSize]);

    // 2. Normalize embeddings to unit length (L2 norm)
    // This ensures Dot Product = Cosine Similarity
    const norms = embeddingMatrix.norm('euclidean', 1, true);
    const normalizedEmbeddings = embeddingMatrix.div(norms);

    // 3. Compute Similarity Matrix [N, N] using Matrix Multiplication
    // Sim(A, B) = A . B (since normalized)
    const similarityMatrix = tf.matMul(normalizedEmbeddings, normalizedEmbeddings, false, true);

    // 4. Extract data to CPU for grouping logic
    const similarityValues = similarityMatrix.dataSync(); // Float32Array

    // 5. Grouping Logic using Disjoint Set (Union-Find)
    const parent = new Array(count).fill(0).map((_, i) => i);

    function find(i: number): number {
      if (parent[i] === i) return i;
      parent[i] = find(parent[i]);
      return parent[i];
    }

    function union(i: number, j: number) {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent[rootJ] = rootI;
      }
    }

    // Iterate upper triangle of the matrix
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const score = similarityValues[i * count + j];
        if (score >= DUPLICATE_THRESHOLD) {
          union(i, j);
        }
      }
    }

    // 6. Build Groups
    const groupsMap = new Map<number, string[]>();
    for (let i = 0; i < count; i++) {
      const root = find(i);
      if (!groupsMap.has(root)) {
        groupsMap.set(root, []);
      }
      groupsMap.get(root)!.push(analyzedPhotos[i].id);
    }

    // Filter out groups with only 1 photo
    const groups: DuplicateGroup[] = [];
    for (const [_, photoIds] of groupsMap.entries()) {
      if (photoIds.length > 1) {
        groups.push(createDuplicateGroup(photoIds, photos));
      }
    }

    return groups;
  });
};

// Helper to determine the "Best" photo in a group
function createDuplicateGroup(photoIds: string[], allPhotos: Photo[]): DuplicateGroup {
  const groupPhotos = photoIds.map(id => allPhotos.find(p => p.id === id)!).filter(Boolean);

  // Sort criteria:
  // 1. Resolution (Area) Descending
  // 2. File Size Descending
  // 3. Date Ascending (Keep oldest/original)

  groupPhotos.sort((a, b) => {
    const areaA = (a.metadata?.width || 0) * (a.metadata?.height || 0);
    const areaB = (b.metadata?.width || 0) * (b.metadata?.height || 0);
    if (areaA !== areaB) return areaB - areaA;

    const sizeA = a.metadata?.size || 0;
    const sizeB = b.metadata?.size || 0;
    if (sizeA !== sizeB) return sizeB - sizeA;

    return (a.metadata?.lastModified || 0) - (b.metadata?.lastModified || 0);
  });

  return {
    id: crypto.randomUUID(),
    photos: photoIds,
    bestPhotoId: groupPhotos[0].id
  };
}
