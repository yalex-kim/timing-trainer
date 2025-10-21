/**
 * Real-time Timing Feedback Component
 * Displays immediate visual feedback for timing performance
 */

'use client';

import { TimingFeedback as TimingFeedbackType } from '@/types/evaluation';

interface TimingFeedbackProps {
  feedback: TimingFeedbackType | null;
  streak?: number;
  currentPoints?: number;
  averagePoints?: number;
  showStreak?: boolean;
}

export default function TimingFeedback({
  feedback,
  streak = 0,
  currentPoints,
  averagePoints,
  showStreak = true,
}: TimingFeedbackProps) {
  if (!feedback) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
      {/* 메인 피드백 */}
      <div
        className="text-center transition-all duration-200 ease-out animate-bounce-in"
        style={{
          animation: 'bounce-in 0.3s ease-out',
        }}
      >
        {/* 피드백 메시지 */}
        <div
          className="text-8xl font-black mb-4 drop-shadow-2xl"
          style={{
            color: feedback.color,
            textShadow: `0 0 30px ${feedback.color}80, 0 0 60px ${feedback.color}40`,
          }}
        >
          {feedback.category.toUpperCase()}
        </div>

        {/* 편차 표시 */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div
            className="text-5xl font-bold bg-black bg-opacity-70 px-8 py-4 rounded-xl"
            style={{ color: feedback.color }}
          >
            {feedback.displayText}
          </div>

          {/* 방향 표시 */}
          {feedback.direction !== 'on-time' && (
            <div
              className="text-4xl"
              style={{
                color: feedback.direction === 'early' ? '#3b82f6' : '#f59e0b',
              }}
            >
              {feedback.direction === 'early' ? '⬆️ 빠름' : '⬇️ 느림'}
            </div>
          )}
        </div>

        {/* 점수 표시 */}
        {currentPoints !== undefined && (
          <div className="text-3xl font-bold text-white bg-black bg-opacity-70 px-6 py-2 rounded-lg inline-block">
            +{currentPoints.toFixed(0)} 점
          </div>
        )}
      </div>

      {/* 연속 성공 표시 */}
      {showStreak && streak >= 3 && (
        <div className="mt-8 text-center animate-pulse">
          <div className="text-4xl font-bold text-yellow-400 drop-shadow-lg">
            🔥 {streak} 연속!
          </div>
        </div>
      )}

      {/* 평균 점수 표시 */}
      {averagePoints !== undefined && (
        <div className="mt-4 text-center">
          <div className="text-2xl font-medium text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg inline-block">
            평균: {averagePoints.toFixed(1)} 점
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 잘못된 입력 경고 컴포넌트
// ============================================================================

interface WrongInputAlertProps {
  show: boolean;
  expectedInput: string;
  actualInput: string;
}

export function WrongInputAlert({
  show,
  expectedInput,
  actualInput,
}: WrongInputAlertProps) {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-red-500 text-white px-8 py-4 rounded-lg shadow-2xl animate-shake">
        <div className="text-3xl font-bold mb-2">❌ 잘못된 입력!</div>
        <div className="text-xl">
          예상: {expectedInput} / 입력: {actualInput}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 진행도 표시 컴포넌트
// ============================================================================

interface ProgressIndicatorProps {
  currentBeat: number;
  totalBeats: number;
  timeRemaining: string;
  bpm: number;
}

export function ProgressIndicator({
  currentBeat,
  totalBeats,
  timeRemaining,
  bpm,
}: ProgressIndicatorProps) {
  const progress = (currentBeat / totalBeats) * 100;

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="bg-black bg-opacity-70 px-6 py-4 rounded-lg">
        {/* 정보 표시 */}
        <div className="flex items-center gap-6 text-white mb-3">
          <div className="text-2xl font-bold">{bpm} BPM</div>
          <div className="text-2xl font-bold">{timeRemaining}</div>
          <div className="text-lg">
            {currentBeat} / {totalBeats} 비트
          </div>
        </div>

        {/* 진행도 바 */}
        <div className="w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 현재 예상 입력 표시 컴포넌트
// ============================================================================

interface ExpectedInputDisplayProps {
  expectedInputs: string[];
  nextInputs?: string[];
}

export function ExpectedInputDisplay({
  expectedInputs,
  nextInputs,
}: ExpectedInputDisplayProps) {
  const getInputEmoji = (input: string) => {
    if (input.includes('left-hand')) return '👈 왼손';
    if (input.includes('right-hand')) return '👉 오른손';
    if (input.includes('left-foot')) return '🦵 왼발';
    if (input.includes('right-foot')) return '🦵 오른발';
    return input;
  };

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-black bg-opacity-80 px-8 py-6 rounded-2xl">
        {/* 현재 예상 입력 */}
        <div className="text-center mb-4">
          <div className="text-lg text-gray-300 mb-2">다음 입력</div>
          <div className="flex items-center justify-center gap-4">
            {expectedInputs.map((input, index) => (
              <div
                key={index}
                className="text-4xl font-bold text-yellow-400 animate-pulse"
              >
                {getInputEmoji(input)}
              </div>
            ))}
          </div>
        </div>

        {/* 다다음 입력 (미리보기) */}
        {nextInputs && nextInputs.length > 0 && (
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">다다음</div>
            <div className="flex items-center justify-center gap-2">
              {nextInputs.map((input, index) => (
                <div key={index} className="text-2xl text-gray-500">
                  {getInputEmoji(input)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 애니메이션 스타일을 전역 CSS에 추가해야 함
// globals.css에 추가:
/*
@keyframes bounce-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

.animate-bounce-in {
  animation: bounce-in 0.3s ease-out;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
*/
