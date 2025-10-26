export type TrainingType = 'visual' | 'audio';
export type BodyPart = 'hand' | 'foot';
export type TrainingRange = 'left' | 'right' | 'both';

// Custom sequence types
export type CustomBodyPart = 'left-hand' | 'right-hand' | 'left-foot' | 'right-foot';

export interface TrainingSettings {
  trainingType: TrainingType;
  bodyPart: BodyPart;
  trainingRange: TrainingRange;
  bpm: number;
  durationMinutes: number;
  // Custom sequence (when defined, overrides bodyPart + trainingRange)
  customSequence?: CustomBodyPart[];
}

export const DEFAULT_SETTINGS: TrainingSettings = {
  trainingType: 'visual',
  bodyPart: 'hand',
  trainingRange: 'both',
  bpm: 60,
  durationMinutes: 1,
};
