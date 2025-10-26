import React from 'react';
import { BodyPart, TrainingRange, TrainingType } from '@/types';
import { InputType, BeatData, TimingFeedback as TimingFeedbackType } from '@/types/evaluation';
import { getBodyPartColors, getBodyPartLabel, getBodyPartIcon } from '@/utils/bodyPartColors';
import { formatTime } from '@/utils/commonHelpers';
import TimingFeedback from './TimingFeedback';
import { ExpectedInputDisplay } from './TimingFeedback';

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
}

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
}: TrainingDisplayProps) {
  const shouldShowLeft = trainingRange === 'left' || trainingRange === 'both';
  const shouldShowRight = trainingRange === 'right' || trainingRange === 'both';

  // Visual mode: determine active state
  const leftActive = trainingType === 'visual' && isActive && (trainingRange === 'left' || (trainingRange === 'both' && currentSide === 'left'));
  const rightActive = trainingType === 'visual' && isActive && (trainingRange === 'right' || (trainingRange === 'both' && currentSide === 'right'));

  // Get colors for both sides
  const leftColors = getBodyPartColors(bodyPart, 'left');
  const rightColors = getBodyPartColors(bodyPart, 'right');

  // Determine final colors based on mode and active state
  const leftColorClass = trainingType === 'visual'
    ? (leftActive ? leftColors.active : leftColors.inactive)
    : leftColors.inactive;

  const rightColorClass = trainingType === 'visual'
    ? (rightActive ? rightColors.active : rightColors.inactive)
    : rightColors.inactive;

  return (
    <div className="fixed inset-0 bg-black">
      {/* Title (for assessment mode) */}
      {title && (
        <div className="absolute top-4 left-4 z-50">
          <div className="text-white text-xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded">
            {title}
          </div>
        </div>
      )}

      {/* Top info */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
        <div className="text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded">
          {bpm} BPM | {formatTime(timeRemaining)}
        </div>
        <div className="text-white text-lg bg-black bg-opacity-50 px-3 py-2 rounded">
          {currentBeat} / {totalBeats}
        </div>
        <button
          onClick={onExit}
          className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
        >
          ✕
        </button>
      </div>

      {/* Real-time feedback */}
      {currentFeedback && (
        <TimingFeedback
          feedback={currentFeedback}
          currentPoints={currentFeedback.points}
        />
      )}

      {/* Expected input display */}
      {currentBeatData && (
        <ExpectedInputDisplay
          expectedInputs={currentBeatData.expectedInput.expectedTypes}
          nextInputs={nextBeatData?.expectedInput.expectedTypes}
        />
      )}

      {/* Training areas */}
      <div className="h-full flex">
        {shouldShowLeft && (
          <div
            onTouchStart={onLeftTouch}
            className={`flex-1 transition-all duration-100 flex items-center justify-center border-4 cursor-pointer ${
              trainingType === 'visual' && leftActive
                ? `${leftColorClass} border-yellow-300`
                : `${leftColorClass} border-white`
            }`}
          >
            {trainingRange === 'left' && (
              <div className="text-white text-9xl pointer-events-none">
                {getBodyPartIcon(bodyPart, 'left')}
                <div className="text-4xl mt-4">{getBodyPartLabel(bodyPart, 'left')}</div>
              </div>
            )}
          </div>
        )}

        {trainingRange === 'both' && (
          <div className="flex flex-col items-center justify-center bg-gray-800 px-8 pointer-events-none">
            <div className="text-white text-9xl mb-4">
              {bodyPart === 'hand' ? '👐' : '👣'}
            </div>
            <div className="text-white text-3xl">양쪽</div>
          </div>
        )}

        {shouldShowRight && (
          <div
            onTouchStart={onRightTouch}
            className={`flex-1 transition-all duration-100 flex items-center justify-center border-4 cursor-pointer ${
              trainingType === 'visual' && rightActive
                ? `${rightColorClass} border-yellow-300`
                : `${rightColorClass} border-white`
            }`}
          >
            {trainingRange === 'right' && (
              <div className="text-white text-9xl pointer-events-none">
                {getBodyPartIcon(bodyPart, 'right')}
                <div className="text-4xl mt-4">{getBodyPartLabel(bodyPart, 'right')}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
