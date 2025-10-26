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
  UserProfile,
} from '@/types/evaluation';
import { PatternGenerator, TimingEvaluator, calculateAge } from '@/utils/evaluator';
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

  // 사용자 프로필 로드
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const intervalMs = 60000 / bpm;
  const totalBeats = Math.floor((duration * 60 * 1000) / intervalMs);
  const startTimeRef = useRef<number>(0);
  const sessionRef = useRef<TrainingSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // sessionRef 동기화
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // AudioContext 초기화 (재사용)
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // 사용자 프로필 로드
  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const profile = JSON.parse(stored) as UserProfile;
      profile.age = calculateAge(profile.birthDate);
      setUserProfile(profile);
    } else {
      // 사용자 정보가 없으면 메인으로 리다이렉트
      alert('사용자 정보를 먼저 입력해주세요.');
      router.push('/');
    }
  }, [router]);

  // 오디오 비프음
  const playBeep = useCallback(() => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
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
    if (!userProfile) return; // 사용자 프로필 로드 대기

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
      userProfile,
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
  }, [totalBeats, pattern, intervalMs, trainingType, bodyPart, trainingRange, bpm, duration, userProfile]);

  // 입력 처리
  const handleInput = useCallback((inputEvent: InputEvent) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    setSession((prev) => {
      if (!prev) return prev;

      // 타임스탬프 기준으로 가장 가까운 비트 찾기
      const inputTimestamp = inputEvent.timestamp;
      let closestBeatIndex = -1;
      let minDistance = Infinity;

      // 입력 타임스탬프 기준으로 예상 비트 번호 계산
      const estimatedBeatIndex = Math.round(inputTimestamp / intervalMs);

      // 예상 비트 ±2 범위 내에서 가장 가까운 미입력 비트 찾기
      const searchStart = Math.max(0, estimatedBeatIndex - 2);
      const searchEnd = Math.min(prev.beats.length - 1, estimatedBeatIndex + 2);

      for (let i = searchStart; i <= searchEnd; i++) {
        const beat = prev.beats[i];
        // 이미 입력된 비트는 건너뛰기
        if (beat.actualInput !== null) continue;

        const distance = Math.abs(inputTimestamp - beat.expectedTime);
        if (distance < minDistance) {
          minDistance = distance;
          closestBeatIndex = i;
        }
      }

      // 가까운 비트를 못 찾았거나, 너무 멀리 떨어져 있으면 무시
      if (closestBeatIndex === -1 || minDistance > 500) {
        console.log(`Input ignored: no valid beat found (timestamp: ${inputTimestamp}ms, closest distance: ${minDistance}ms)`);
        return prev;
      }

      const currentBeatData = prev.beats[closestBeatIndex];

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
      newBeats[closestBeatIndex] = updatedBeat;

      // 피드백 표시 (다음 입력까지 유지)
      setCurrentFeedback(feedback);

      console.log(`Beat ${closestBeatIndex}: ${feedback.category} (${feedback.displayText})`, updatedBeat);

      return { ...prev, beats: newBeats };
    });
  }, [intervalMs]);

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

      // 비트 카운터 증가 전에 이전 비트 체크
      setCurrentBeat((prev) => {
        // 이전 비트가 입력되지 않았다면 miss 피드백 표시
        const currentSession = sessionRef.current;
        if (currentSession && prev > 0) {
          const previousBeat = currentSession.beats[prev - 1];
          if (previousBeat && previousBeat.actualInput === null) {
            // MISS 피드백 생성
            const missFeedback: TimingFeedbackType = {
              category: 'miss',
              deviation: 999,
              direction: 'late',
              points: 0,
              color: '#999999',
              message: 'MISSED',
              displayText: 'NO INPUT',
            };
            setCurrentFeedback(missFeedback);
          }
        }

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

    // 최신 세션 데이터로 평가 (나이와 모드 기반)
    const results = TimingEvaluator.evaluateSession(
      currentSession.beats,
      currentSession.userProfile.age!,
      currentSession.settings.trainingType
    );

    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, results, endTime: Date.now() };
    });

    setShowResults(true);

    console.log('Session finished:', results);
    console.log('User age:', currentSession.userProfile.age);
    console.log('Training mode:', currentSession.settings.trainingType);
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

  // 청각 훈련 모드 (시각 모드와 동일한 UI)
  if (trainingType === 'audio') {
    const shouldShowLeft = trainingRange === 'left' || trainingRange === 'both';
    const shouldShowRight = trainingRange === 'right' || trainingRange === 'both';

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

        {/* 청각 영역 (시각 모드와 동일, 터치 가능) */}
        <div className="h-full flex">
          {shouldShowLeft && (
            <div
              onTouchStart={handleLeftTouch}
              className="flex-1 transition-all duration-100 flex items-center justify-center border-4 bg-green-700 border-white cursor-pointer"
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
              className="flex-1 transition-all duration-100 flex items-center justify-center border-4 bg-red-700 border-white cursor-pointer"
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

  return null;
}

export default function TrainingPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black flex items-center justify-center text-white text-2xl">로딩중...</div>}>
      <TrainingContent />
    </Suspense>
  );
}
