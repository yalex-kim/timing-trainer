export type TrainingType = 'visual' | 'audio';
export type BodyPart = 'hand' | 'foot';
export type TrainingRange = 'left' | 'right' | 'both';
export type CustomBodyPart = 'left-hand' | 'right-hand' | 'left-foot' | 'right-foot';

export interface TrainingSettings {
  trainingType: TrainingType;
  bodyPart: BodyPart;
  trainingRange: TrainingRange;
  bpm: number;
  durationMinutes: number;
  customSequence?: CustomBodyPart[]; // 커스텀 시퀀스 (최대 4개, 중복 불가)
}

export const DEFAULT_SETTINGS: TrainingSettings = {
  trainingType: 'visual',
  bodyPart: 'hand',
  trainingRange: 'both',
  bpm: 60,
  durationMinutes: 1,
};
