'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrainingType, BodyPart, TrainingRange } from '@/types';
import {
  BeatData,
  InputEvent,
  InputType,
  TrainingSession,
  SessionResults as SessionResultsType,
  TimingFeedback as TimingFeedbackType,
} from '@/types/evaluation';
import { PatternGenerator, TimingEvaluator } from '@/utils/evaluator';
import { useInputHandler } from '@/hooks/useInputHandler';
import TimingFeedback from '@/components/TimingFeedback';
import SessionResults from '@/components/SessionResults';
import { ExpectedInputDisplay } from '@/components/TimingFeedback';

function TrainingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const trainingType = searchParams.get('trainingType') as TrainingType;
  const bodyPart = searchParams.get('bodyPart') as BodyPart;
  const trainingRange = searchParams.get('trainingRange') as TrainingRange;
  const bpm = parseInt(searchParams.get('bpm') || '60');
  const duration = parseInt(searchParams.get('duration') || '1');

  // 훈련 패턴 결정
  const pattern = PatternGenerator.settingsToPattern(bodyPart, trainingRange);

  // 상태 관리
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<TimingFeedbackType | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);

  // 시각 훈련용 상태
  const [currentSide, setCurrentSide] = useState<'left' | 'right'>('left');
  const [isActive, setIsActive] = useState(false);

  const intervalMs = 60000 / bpm;
  const totalBeats = Math.floor((duration * 60 * 1000) / intervalMs);
  const startTimeRef = useRef<number>(0);
  const sessionRef = useRef<TrainingSession | null>(null);

  // sessionRef 동기화
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // 오디오 비프음
  const playBeep = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  // 세션 초기화
  useEffect(() => {
    startTimeRef.current = performance.now();
    const beats: BeatData[] = [];

    for (let i = 0; i < totalBeats; i++) {
      const expectedInput = PatternGenerator.generateExpectedInput(pattern, i);
      beats.push({
        beatNumber: i,
        expectedTime: i * intervalMs,
        expectedInput,
        actualInput: null,
        actualTime: null,
        deviation: null,
        isCorrectInput: false,
        isWrongInput: false,
        feedback: null,
      });
    }

    const newSession: TrainingSession = {
      sessionId: `session-${Date.now()}`,
      sessionNumber: 0,
      date: new Date().toISOString(),
      startTime: Date.now(),
      settings: {
        trainingType,
        bodyPart,
        trainingRange,
        bpm,
        durationMinutes: duration,
        pattern,
      },
      beats,
    };

    setSession(newSession);
    setIsRunning(true);
  }, [totalBeats, pattern, intervalMs, trainingType, bodyPart, trainingRange, bpm, duration]);

  // 입력 처리
  const handleInput = useCallback((inputEvent: InputEvent) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    setSession((prev) => {
      if (!prev) return prev;

      const beatIndex = currentBeat;
      const currentBeatData = prev.beats[beatIndex];
      if (!currentBeatData) return prev;

      // 타이밍 평가
      const { feedback, isCorrectInput } = TimingEvaluator.evaluateBeat(
        currentBeatData.expectedTime,
        inputEvent.timestamp,
        inputEvent.type,
        currentBeatData.expectedInput
      );

      // 비트 데이터 업데이트
      const updatedBeat: BeatData = {
        ...currentBeatData,
        actualInput: inputEvent,
        actualTime: inputEvent.timestamp,
        deviation: feedback.deviation,
        isCorrectInput,
        isWrongInput: !isCorrectInput,
        feedback,
      };

      const newBeats = [...prev.beats];
      newBeats[beatIndex] = updatedBeat;

      // 피드백 표시 (다음 입력까지 유지)
      setCurrentFeedback(feedback);

      console.log(`Beat ${beatIndex}: ${feedback.category} (${feedback.displayText})`, updatedBeat);

      return { ...prev, beats: newBeats };
    });
  }, [currentBeat]);

  // 입력 핸들러 등록 (키보드)
  useInputHandler({
    onInput: handleInput,
    enableKeyboard: true,
  });

  // 터치 입력 핸들러
  const handleTouchInput = useCallback((inputType: InputType) => {
    if (!session || !isRunning) return;

    const currentBeatData = session.beats[currentBeat];
    if (!currentBeatData) return;

    // 터치 이벤트 생성
    const touchEvent: InputEvent = {
      type: inputType,
      timestamp: performance.now() - startTimeRef.current,
      source: 'touch',
      rawData: { inputType },
    };

    // 기존 handleInput 로직 재사용
    handleInput(touchEvent);
  }, [session, currentBeat, isRunning, handleInput]);

  // 비트 진행 (시각/청각 효과 + 비트 카운터)
  useEffect(() => {
    if (!isRunning) return;

    const beatTimer = setInterval(() => {
      // 비트 효과
      if (trainingType === 'audio') {
        playBeep();
      }

      if (trainingType === 'visual') {
        setIsActive(true);
        if (trainingRange === 'both') {
          setCurrentSide((prev) => (prev === 'left' ? 'right' : 'left'));
        }
        setTimeout(() => {
          setIsActive(false);
        }, intervalMs * 0.3);
      }

      // 비트 카운터 증가
      setCurrentBeat((prev) => {
        if (prev + 1 >= totalBeats) {
          clearInterval(beatTimer);
          // 훈련 종료
          setTimeout(() => finishSession(), 500);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(beatTimer);
  }, [isRunning, intervalMs, totalBeats, trainingType, trainingRange, playBeep]);

  // 타이머 (남은 시간)
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  // ESC 키로 종료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // 세션 종료
  const finishSession = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    setIsRunning(false);

    // 최신 세션 데이터로 평가
    const results = TimingEvaluator.evaluateSession(currentSession.beats);

    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, results, endTime: Date.now() };
    });

    setShowResults(true);

    console.log('Session finished:', results);
    console.log('Total beats:', currentSession.beats.length);
    console.log('Beats with input:', currentSession.beats.filter(b => b.actualInput !== null).length);
  }, []);

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExit = () => {
    router.push('/');
  };

  const handleRestart = () => {
    window.location.reload();
  };

  // 결과 화면
  if (showResults && session?.results) {
    return (
      <SessionResults
        results={session.results}
        onRestart={handleRestart}
        onExit={handleExit}
      />
    );
  }

  // 다음 비트 정보
  const currentBeatData = session?.beats[currentBeat];
  const nextBeatData = session?.beats[currentBeat + 1];

  // 시각 훈련 모드
  if (trainingType === 'visual') {
    const shouldShowLeft = trainingRange === 'left' || trainingRange === 'both';
    const shouldShowRight = trainingRange === 'right' || trainingRange === 'both';
    const leftActive = isActive && (trainingRange === 'left' || (trainingRange === 'both' && currentSide === 'left'));
    const rightActive = isActive && (trainingRange === 'right' || (trainingRange === 'both' && currentSide === 'right'));

    // 터치 핸들러
    const handleLeftTouch = (e: React.TouchEvent) => {
      e.preventDefault();
      const inputType = bodyPart === 'hand' ? 'left-hand' : 'left-foot';
      handleTouchInput(inputType as InputType);
    };

    const handleRightTouch = (e: React.TouchEvent) => {
      e.preventDefault();
      const inputType = bodyPart === 'hand' ? 'right-hand' : 'right-foot';
      handleTouchInput(inputType as InputType);
    };

    return (
      <div className="fixed inset-0 bg-black">
        {/* 상단 정보 */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
          <div className="text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded">
            {bpm} BPM | {formatTime(timeRemaining)}
          </div>
          <div className="text-white text-lg bg-black bg-opacity-50 px-3 py-2 rounded">
            {currentBeat} / {totalBeats}
          </div>
          <button
            onClick={handleExit}
            className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* 실시간 피드백 */}
        {currentFeedback && (
          <TimingFeedback
            feedback={currentFeedback}
            currentPoints={currentFeedback.points}
          />
        )}

        {/* 예상 입력 표시 */}
        {currentBeatData && (
          <ExpectedInputDisplay
            expectedInputs={currentBeatData.expectedInput.expectedTypes}
            nextInputs={nextBeatData?.expectedInput.expectedTypes}
          />
        )}

        {/* 시각 영역 (터치 가능) */}
        <div className="h-full flex">
          {shouldShowLeft && (
            <div
              onTouchStart={handleLeftTouch}
              className={`flex-1 transition-all duration-100 flex items-center justify-center border-4 cursor-pointer ${
                leftActive ? 'bg-green-400 border-yellow-300' : 'bg-green-700 border-white'
              }`}
            >
              {trainingRange === 'left' && (
                <div className="text-white text-9xl pointer-events-none">
                  {bodyPart === 'hand' ? '✋' : '🦶'}
                  <div className="text-4xl mt-4">왼쪽</div>
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
              onTouchStart={handleRightTouch}
              className={`flex-1 transition-all duration-100 flex items-center justify-center border-4 cursor-pointer ${
                rightActive ? 'bg-red-400 border-yellow-300' : 'bg-red-700 border-white'
              }`}
            >
              {trainingRange === 'right' && (
                <div className="text-white text-9xl pointer-events-none">
                  {bodyPart === 'hand' ? '🤚' : '🦶'}
                  <div className="text-4xl mt-4">오른쪽</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 청각 훈련 모드
  if (trainingType === 'audio') {
    // 터치 핸들러 (4분할)
    const handleQuadrantTouch = (inputType: InputType) => (e: React.TouchEvent) => {
      e.preventDefault();
      handleTouchInput(inputType);
    };

    const isExpected = (inputType: InputType) => {
      return currentBeatData?.expectedInput.expectedTypes.includes(inputType);
    };

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 to-purple-900">
        {/* 상단 정보 */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
          <div className="text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded">
            {bpm} BPM | {formatTime(timeRemaining)}
          </div>
          <div className="text-white text-lg bg-black bg-opacity-50 px-3 py-2 rounded">
            {currentBeat} / {totalBeats}
          </div>
          <button
            onClick={handleExit}
            className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* 실시간 피드백 */}
        {currentFeedback && (
          <TimingFeedback
            feedback={currentFeedback}
            currentPoints={currentFeedback.points}
          />
        )}

        {/* 예상 입력 표시 */}
        {currentBeatData && (
          <ExpectedInputDisplay
            expectedInputs={currentBeatData.expectedInput.expectedTypes}
            nextInputs={nextBeatData?.expectedInput.expectedTypes}
          />
        )}

        {/* 4분할 터치 영역 */}
        <div className="h-full flex flex-col">
          {/* 상단: 손 */}
          <div className="flex-1 flex">
            {/* 왼손 */}
            <div
              onTouchStart={handleQuadrantTouch('left-hand')}
              className={`flex-1 flex items-center justify-center border-2 transition-all ${
                isExpected('left-hand')
                  ? 'border-yellow-300 border-4 bg-blue-500'
                  : 'border-blue-400 bg-blue-600 bg-opacity-30'
              }`}
            >
              <div className="text-center pointer-events-none">
                <div className="text-8xl mb-2">👈</div>
                <div className="text-white text-3xl font-bold">왼손</div>
                <div className="text-white text-2xl mt-2 opacity-70">E</div>
              </div>
            </div>

            {/* 오른손 */}
            <div
              onTouchStart={handleQuadrantTouch('right-hand')}
              className={`flex-1 flex items-center justify-center border-2 transition-all ${
                isExpected('right-hand')
                  ? 'border-yellow-300 border-4 bg-blue-400'
                  : 'border-blue-300 bg-blue-500 bg-opacity-30'
              }`}
            >
              <div className="text-center pointer-events-none">
                <div className="text-8xl mb-2">👉</div>
                <div className="text-white text-3xl font-bold">오른손</div>
                <div className="text-white text-2xl mt-2 opacity-70">I</div>
              </div>
            </div>
          </div>

          {/* 하단: 발 */}
          <div className="flex-1 flex">
            {/* 왼발 */}
            <div
              onTouchStart={handleQuadrantTouch('left-foot')}
              className={`flex-1 flex items-center justify-center border-2 transition-all ${
                isExpected('left-foot')
                  ? 'border-yellow-300 border-4 bg-green-500'
                  : 'border-green-400 bg-green-600 bg-opacity-30'
              }`}
            >
              <div className="text-center pointer-events-none">
                <div className="text-8xl mb-2">🦵</div>
                <div className="text-white text-3xl font-bold">왼발</div>
                <div className="text-white text-2xl mt-2 opacity-70">X</div>
              </div>
            </div>

            {/* 오른발 */}
            <div
              onTouchStart={handleQuadrantTouch('right-foot')}
              className={`flex-1 flex items-center justify-center border-2 transition-all ${
                isExpected('right-foot')
                  ? 'border-yellow-300 border-4 bg-green-400'
                  : 'border-green-300 bg-green-500 bg-opacity-30'
              }`}
            >
              <div className="text-center pointer-events-none">
                <div className="text-8xl mb-2">🦵</div>
                <div className="text-white text-3xl font-bold">오른발</div>
                <div className="text-white text-2xl mt-2 opacity-70">N</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function TrainingPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black flex items-center justify-center text-white text-2xl">로딩중...</div>}>
      <TrainingContent />
    </Suspense>
  );
}
