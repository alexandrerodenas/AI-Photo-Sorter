
export enum PhotoStatus {
  QUEUED = 'QUEUED',
  ANALYZING = 'ANALYZING',
  ANALYZED = 'ANALYZED',
  ERROR = 'ERROR',
}

export interface Prediction {
  label: string;
  score: number;
}

export interface Photo {
  id: string; // The full path of the photo, used as a unique ID
  binary: string; // base64 encoded string
  objectURL: string; // blob url for efficient rendering
  status: PhotoStatus;
  predictions: Prediction[];
  selected: boolean;
}

export interface FilterRule {
  id: string;
  label: string;
  confidence: number; // 0-100
}

export interface UserProfile {
  firstName: string;
  rules: FilterRule[];
  autoApplyRules: boolean;
}