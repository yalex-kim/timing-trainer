import React from 'react';
import { BodyPart, TrainingRange, TrainingType, CustomBodyPart } from '@/types';
import { InputType, BeatData, TimingFeedback as TimingFeedbackType } from '@/types/evaluation';
import { getBodyPartColors, getBodyPartLabel, getBodyPartIcon } from '@/utils/bodyPartColors';
import { formatTime } from '@/utils/commonHelpers';
import TimingFeedback from './TimingFeedback';

interface TrainingDisplayProps {
  trainingType: TrainingType;
  bodyPart: BodyPart;
  trainingRange: TrainingRange;
  bpm: number;
  timeRemaining: number;
  currentBeat: number;
  totalBeats: number;
  isActive: boolean;
  currentSide: 'left' | 'right';
  currentFeedback: TimingFeedbackType | null;
  currentBeatData: BeatData | undefined;
  nextBeatData: BeatData | undefined;
  onLeftTouch: (e: React.TouchEvent) => void;
  onRightTouch: (e: React.TouchEvent) => void;
  onExit: () => void;
  title?: string; // Optional title for assessment mode
  customSequence?: CustomBodyPart[] | null; // 커스텀 시퀀스
}

type BodyPartType = 'left-hand' | 'right-hand' | 'left-foot' | 'right-foot';

export function TrainingDisplay({
  trainingType,
  bodyPart,
  trainingRange,
  bpm,
  timeRemaining,
  currentBeat,
  totalBeats,
  isActive,
  currentSide,
  currentFeedback,
  currentBeatData,
  nextBeatData,
  onLeftTouch,
  onRightTouch,
  onExit,
  title,
  customSequence,
}: TrainingDisplayProps) {
  // 각 영역이 현재 세션에서 활성화되어 있는지 확인
  const isBodyPartEnabled = (part: BodyPartType): boolean => {
    // 커스텀 시퀀스가 있으면 해당 시퀀스에 포함된 신체 부위만 활성화
    if (customSequence && customSequence.length > 0) {
      return customSequence.includes(part as CustomBodyPart);
    }

    // 기존 로직
    const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];

    // 신체 부위가 맞는지 확인
    if (bodyPart !== type) return false;

    // 범위가 맞는지 확인
    if (trainingRange === 'both') return true;
    if (trainingRange === side) return true;

    return false;
  };

  // 시각 모드에서 현재 눌러야 하는 영역인지 확인
  const isBodyPartActive = (part: BodyPartType): boolean => {
    if (trainingType !== 'visual') return false;
    if (!isActive) return false;

    // 커스텀 시퀀스 모드: currentBeatData의 expectedTypes를 확인
    if (customSequence && customSequence.length > 0 && currentBeatData) {
      return currentBeatData.expectedInput.expectedTypes.includes(part as InputType);
    }

    // 기존 로직
    const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];

    // 신체 부위가 맞는지 확인
    if (bodyPart !== type) return false;

    // 현재 눌러야 하는 쪽인지 확인
    if (trainingRange === 'both' && currentSide === side) return true;
    if (trainingRange === side) return true;

    return false;
  };

  // 터치 핸들러
  const handleTouch = (part: BodyPartType) => (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isBodyPartEnabled(part)) return; // 비활성화된 영역은 터치 무시

    const [side] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
    if (side === 'left') {
      onLeftTouch(e);
    } else {
      onRightTouch(e);
    }
  };

  // 영역 렌더링
  const renderBodyPart = (part: BodyPartType) => {
    const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
    const enabled = isBodyPartEnabled(part);
    const active = isBodyPartActive(part);

    // 색상 결정
    let bgColor: string;
    let opacity = 'opacity-100';

    if (!enabled) {
      // 비활성화된 영역: 회색
      bgColor = 'bg-gray-600';
      opacity = 'opacity-40';
    } else {
      // 활성화된 영역: 신체 부위별 색상
      const colors = getBodyPartColors(type as BodyPart, side);
      bgColor = active ? colors.active : colors.inactive;
    }

    // 아이콘 크기 및 밝기
    const iconScale = active ? 'scale-125' : 'scale-100';
    const iconBrightness = active ? 'brightness-125' : 'brightness-100';

    return (
      <div
        key={part}
        onTouchStart={handleTouch(part)}
        className={`flex items-center justify-center border-2 border-gray-800 transition-all duration-200 ${
          enabled ? 'cursor-pointer' : 'cursor-not-allowed'
        } ${bgColor} ${opacity}`}
      >
        <div className={`text-white text-center pointer-events-none transition-transform duration-200 ${iconScale} ${iconBrightness}`}>
          <div className="text-7xl mb-2">{getBodyPartIcon(type as BodyPart, side)}</div>
          <div className="text-2xl font-bold">{getBodyPartLabel(type as BodyPart, side)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header area */}
      <div className="h-20 flex items-center justify-between px-4 bg-gray-900 border-b-2 border-gray-700">
        {/* Title (훈련/검사 표시) */}
        <div className="text-white text-xl font-bold">
          {title || '훈련 모드'}
        </div>

        {/* Top info */}
        <div className="flex items-center gap-4">
          <div className="text-white text-xl font-bold">
            {bpm} BPM | {formatTime(timeRemaining)}
          </div>
          <div className="text-white text-lg">
            {currentBeat} / {totalBeats}
          </div>
          <button
            onClick={onExit}
            className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Real-time feedback */}
      {currentFeedback && (
        <TimingFeedback
          feedback={currentFeedback}
          currentPoints={currentFeedback.points}
        />
      )}

      {/* 4-split grid (2x2) */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2">
        {/* Top-left: Left hand */}
        {renderBodyPart('left-hand')}

        {/* Top-right: Right hand */}
        {renderBodyPart('right-hand')}

        {/* Bottom-left: Left foot */}
        {renderBodyPart('left-foot')}

        {/* Bottom-right: Right foot */}
        {renderBodyPart('right-foot')}
      </div>
    </div>
  );
}
