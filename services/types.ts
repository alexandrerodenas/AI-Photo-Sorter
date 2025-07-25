export enum PhotoStatus {
  QUEUED = 'QUEUED',
  ANALYZING = 'ANALYZING',
  ANALYZED = 'ANALYZED',
  ERROR = 'ERROR',
  UNCATEGORIZED = 'UNCATEGORIZED',
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
  classifications: Prediction[];
  detections: Prediction[];
  selected: boolean;
}

export interface FilterRule {
  id: string;
  label: string;
  confidence: number; // 0-100
}

export interface UserProfile {
  firstName: string;
  classificationRules: FilterRule[];
  detectionRules: FilterRule[];
  autoApplyRules: boolean;
  unknownThreshold?: number; // 0-50, percentage for classifying photos as 'Uncategorized'
}