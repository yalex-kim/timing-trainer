export type TrainingType = 'visual' | 'audio';
export type BodyPart = 'hand' | 'foot';
export type TrainingRange = 'left' | 'right' | 'both';

export interface TrainingSettings {
  trainingType: TrainingType;
  bodyPart: BodyPart;
  trainingRange: TrainingRange;
  bpm: number;
  durationMinutes: number;
}

export const DEFAULT_SETTINGS: TrainingSettings = {
  trainingType: 'visual',
  bodyPart: 'hand',
  trainingRange: 'both',
  bpm: 60,
  durationMinutes: 1,
};
