'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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

// 검사 순서 정의
interface AssessmentTest {
  id: number;
  name: string;
  bodyPart: BodyPart;
  trainingRange: TrainingRange;
  trainingType: TrainingType;
}

const ASSESSMENT_SEQUENCE: AssessmentTest[] = [
  { id: 1, name: '왼손 청각', bodyPart: 'hand', trainingRange: 'left', trainingType: 'audio' },
  { id: 2, name: '왼손 시각', bodyPart: 'hand', trainingRange: 'left', trainingType: 'visual' },
  { id: 3, name: '오른손 청각', bodyPart: 'hand', trainingRange: 'right', trainingType: 'audio' },
  { id: 4, name: '오른손 시각', bodyPart: 'hand', trainingRange: 'right', trainingType: 'visual' },
  { id: 5, name: '왼발 청각', bodyPart: 'foot', trainingRange: 'left', trainingType: 'audio' },
  { id: 6, name: '왼발 시각', bodyPart: 'foot', trainingRange: 'left', trainingType: 'visual' },
  { id: 7, name: '오른발 청각', bodyPart: 'foot', trainingRange: 'right', trainingType: 'audio' },
  { id: 8, name: '오른발 시각', bodyPart: 'foot', trainingRange: 'right', trainingType: 'visual' },
];

const BPM = 60;
const DURATION_MINUTES = 1;

type AssessmentPhase = 'ready' | 'countdown' | 'testing' | 'waiting' | 'complete';

function AssessmentContent() {
  const router = useRouter();

  // 사용자 프로필
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // 검사 진행 상태
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [phase, setPhase] = useState<AssessmentPhase>('ready');
  const [countdown, setCountdown] = useState(5);

  // 현재 검사 세션
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<TimingFeedbackType | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(DURATION_MINUTES * 60);

  // 시각 훈련용 상태
  const [currentSide, setCurrentSide] = useState<'left' | 'right'>('left');
  const [isActive, setIsActive] = useState(false);

  // 모든 검사 결과 저장
  const [allResults, setAllResults] = useState<SessionResultsType[]>([]);

  const intervalMs = 60000 / BPM;
  const totalBeats = Math.floor((DURATION_MINUTES * 60 * 1000) / intervalMs);
  const startTimeRef = useRef<number>(0);
  const sessionRef = useRef<TrainingSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentTest = ASSESSMENT_SEQUENCE[currentTestIndex];

  // sessionRef 동기화
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // 사용자 프로필 로드
  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const profile = JSON.parse(stored) as UserProfile;
      profile.age = calculateAge(profile.birthDate);
      setUserProfile(profile);
    } else {
      alert('사용자 정보를 먼저 입력해주세요.');
      router.push('/');
    }
  }, [router]);

  // AudioContext 초기화
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

  // 카운트다운 로직
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      startTest();
    }
  }, [phase, countdown]);

  // 검사 시작
  const startTest = useCallback(() => {
    if (!userProfile || !currentTest) return;

    const pattern = PatternGenerator.settingsToPattern(currentTest.bodyPart, currentTest.trainingRange);
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
      sessionId: `assessment-${currentTestIndex}-${Date.now()}`,
      sessionNumber: currentTestIndex,
      date: new Date().toISOString(),
      startTime: Date.now(),
      userProfile,
      settings: {
        trainingType: currentTest.trainingType,
        bodyPart: currentTest.bodyPart,
        trainingRange: currentTest.trainingRange,
        bpm: BPM,
        durationMinutes: DURATION_MINUTES,
        pattern,
      },
      beats,
    };

    setSession(newSession);
    setCurrentBeat(0);
    setIsRunning(true);
    setPhase('testing');
    setTimeRemaining(DURATION_MINUTES * 60);
  }, [userProfile, currentTest, currentTestIndex, totalBeats, intervalMs]);

  // 입력 처리
  const handleInput = useCallback((inputEvent: InputEvent) => {
    const currentSession = sessionRef.current;
    if (!currentSession || phase !== 'testing') return;

    setSession((prev) => {
      if (!prev) return prev;

      const inputTimestamp = inputEvent.timestamp;
      let closestBeatIndex = -1;
      let minDistance = Infinity;

      const estimatedBeatIndex = Math.round(inputTimestamp / intervalMs);
      const searchStart = Math.max(0, estimatedBeatIndex - 2);
      const searchEnd = Math.min(prev.beats.length - 1, estimatedBeatIndex + 2);

      for (let i = searchStart; i <= searchEnd; i++) {
        const beat = prev.beats[i];
        if (beat.actualInput !== null) continue;

        const distance = Math.abs(inputTimestamp - beat.expectedTime);
        if (distance < minDistance) {
          minDistance = distance;
          closestBeatIndex = i;
        }
      }

      if (closestBeatIndex === -1 || minDistance > 500) {
        return prev;
      }

      const currentBeatData = prev.beats[closestBeatIndex];

      const { feedback, isCorrectInput } = TimingEvaluator.evaluateBeat(
        currentBeatData.expectedTime,
        inputEvent.timestamp,
        inputEvent.type,
        currentBeatData.expectedInput
      );

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

      setCurrentFeedback(feedback);

      return { ...prev, beats: newBeats };
    });
  }, [intervalMs, phase]);

  // 입력 핸들러 등록
  useInputHandler({
    onInput: handleInput,
    enableKeyboard: phase === 'testing',
  });

  // 터치 입력 핸들러
  const handleTouchInput = useCallback((inputType: InputType) => {
    if (!session || !isRunning) return;

    const touchEvent: InputEvent = {
      type: inputType,
      timestamp: performance.now() - startTimeRef.current,
      source: 'touch',
      rawData: { inputType },
    };

    handleInput(touchEvent);
  }, [session, isRunning, handleInput]);

  // 비트 진행
  useEffect(() => {
    if (!isRunning || phase !== 'testing') return;

    const beatTimer = setInterval(() => {
      if (currentTest.trainingType === 'audio') {
        playBeep();
      }

      if (currentTest.trainingType === 'visual') {
        setIsActive(true);
        if (currentTest.trainingRange === 'both') {
          setCurrentSide((prev) => (prev === 'left' ? 'right' : 'left'));
        }
        setTimeout(() => {
          setIsActive(false);
        }, intervalMs * 0.3);
      }

      setCurrentBeat((prev) => {
        const currentSession = sessionRef.current;
        if (currentSession && prev > 0) {
          const previousBeat = currentSession.beats[prev - 1];
          if (previousBeat && previousBeat.actualInput === null) {
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
          setTimeout(() => finishTest(), 500);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(beatTimer);
  }, [isRunning, phase, intervalMs, totalBeats, currentTest, playBeep]);

  // 타이머
  useEffect(() => {
    if (!isRunning || phase !== 'testing') return;

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
  }, [isRunning, phase]);

  // 검사 종료
  const finishTest = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    setIsRunning(false);

    const results = TimingEvaluator.evaluateSession(
      currentSession.beats,
      currentSession.userProfile.age!,
      currentSession.settings.trainingType
    );

    setAllResults((prev) => [...prev, results]);
    setSession(null);

    // 다음 검사가 있으면 대기 상태, 없으면 완료
    if (currentTestIndex < ASSESSMENT_SEQUENCE.length - 1) {
      setPhase('waiting');
    } else {
      setPhase('complete');
    }
  }, [currentTestIndex]);

  // 다음 검사로 진행
  const handleNextTest = useCallback(() => {
    setCurrentTestIndex((prev) => prev + 1);
    setCountdown(5);
    setPhase('countdown');
    setCurrentFeedback(null);
  }, []);

  // 아무 키나 눌러서 다음 검사 시작
  useEffect(() => {
    if (phase !== 'waiting') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      handleNextTest();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, handleNextTest]);

  // ESC 키로 종료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'testing') {
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, phase]);

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

  // 로딩 중
  if (!userProfile) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white text-2xl">
        로딩중...
      </div>
    );
  }

  // 완료 화면 (종합 결과)
  if (phase === 'complete' && allResults.length > 0) {
    // 전체 평균 계산
    const totalTaskAverage = allResults.reduce((sum, r) => sum + r.taskAverage, 0) / allResults.length;

    return (
      <div className="fixed inset-0 bg-black overflow-y-auto">
        <div className="min-h-screen flex items-start justify-center">
          <div className="bg-white rounded-lg shadow-2xl p-8 m-8 max-w-4xl w-full">
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
              검사 완료
            </h1>

            {/* 종합 결과 */}
            <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h2 className="text-2xl font-bold text-green-800 mb-4">종합 결과</h2>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">전체 평균 Task Average</div>
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {totalTaskAverage.toFixed(1)}ms
                </div>
              </div>
            </div>

            {/* 개별 검사 결과 */}
            <div className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-gray-800">개별 검사 결과</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ASSESSMENT_SEQUENCE.map((test, index) => {
                  const result = allResults[index];
                  if (!result) return null;

                  return (
                    <div key={test.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="font-bold text-gray-800 mb-2">{test.name}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-gray-600">Task Average</div>
                          <div className="font-bold text-lg">{result.taskAverage.toFixed(1)}ms</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Class</div>
                          <div className="font-bold text-lg">Class {result.timingClass}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-4">
              <button
                onClick={handleRestart}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors"
              >
                다시 검사
              </button>
              <button
                onClick={handleExit}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 준비 화면
  if (phase === 'ready') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="bg-white p-12 rounded-lg shadow-2xl max-w-2xl">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
            타이밍 검사 시작
          </h1>
          <div className="mb-8 space-y-4">
            <p className="text-lg text-gray-700">
              총 <span className="font-bold text-green-600">8가지 검사</span>를 순서대로 진행합니다.
            </p>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">검사 순서:</div>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                {ASSESSMENT_SEQUENCE.map((test) => (
                  <li key={test.id}>{test.name}</li>
                ))}
              </ol>
            </div>
            <p className="text-gray-600">
              각 검사는 <span className="font-bold">60 BPM</span>으로 <span className="font-bold">1분</span>간 진행됩니다.
            </p>
          </div>
          <button
            onClick={() => {
              setCountdown(5);
              setPhase('countdown');
            }}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 px-6 rounded-lg font-bold text-xl transition-all shadow-lg hover:shadow-xl"
          >
            검사 시작
          </button>
        </div>
      </div>
    );
  }

  // 대기 화면 (다음 검사로)
  if (phase === 'waiting') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white p-12 rounded-lg shadow-2xl max-w-2xl text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            검사 {currentTestIndex + 1} 완료!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            다음 검사: <span className="font-bold text-blue-600">{ASSESSMENT_SEQUENCE[currentTestIndex + 1]?.name}</span>
          </p>
          <p className="text-lg text-gray-500 mb-8">
            준비가 되면 아무 키나 눌러주세요
          </p>
          <div className="text-gray-400 text-sm">
            진행 상황: {currentTestIndex + 1} / {ASSESSMENT_SEQUENCE.length}
          </div>
        </div>
      </div>
    );
  }

  // 카운트다운 화면
  if (phase === 'countdown') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-4xl font-bold mb-8">
            {currentTest.name}
          </h2>
          <div className="text-white text-9xl font-bold mb-4 animate-pulse">
            {countdown}
          </div>
          <div className="text-white text-2xl">
            검사 시작까지...
          </div>
        </div>
      </div>
    );
  }

  // 검사 진행 화면
  const currentBeatData = session?.beats[currentBeat];
  const nextBeatData = session?.beats[currentBeat + 1];

  if (phase === 'testing' && currentTest.trainingType === 'visual') {
    const shouldShowLeft = currentTest.trainingRange === 'left' || currentTest.trainingRange === 'both';
    const shouldShowRight = currentTest.trainingRange === 'right' || currentTest.trainingRange === 'both';
    const leftActive = isActive && (currentTest.trainingRange === 'left' || (currentTest.trainingRange === 'both' && currentSide === 'left'));
    const rightActive = isActive && (currentTest.trainingRange === 'right' || (currentTest.trainingRange === 'both' && currentSide === 'right'));

    const handleLeftTouch = (e: React.TouchEvent) => {
      e.preventDefault();
      const inputType = currentTest.bodyPart === 'hand' ? 'left-hand' : 'left-foot';
      handleTouchInput(inputType as InputType);
    };

    const handleRightTouch = (e: React.TouchEvent) => {
      e.preventDefault();
      const inputType = currentTest.bodyPart === 'hand' ? 'right-hand' : 'right-foot';
      handleTouchInput(inputType as InputType);
    };

    return (
      <div className="fixed inset-0 bg-black">
        <div className="absolute top-4 left-4 z-50">
          <div className="text-white text-xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded">
            {currentTest.name} ({currentTestIndex + 1}/{ASSESSMENT_SEQUENCE.length})
          </div>
        </div>

        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
          <div className="text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded">
            {BPM} BPM | {formatTime(timeRemaining)}
          </div>
          <div className="text-white text-lg bg-black bg-opacity-50 px-3 py-2 rounded">
            {currentBeat} / {totalBeats}
          </div>
        </div>

        {currentFeedback && (
          <TimingFeedback
            feedback={currentFeedback}
            currentPoints={currentFeedback.points}
          />
        )}

        {currentBeatData && (
          <ExpectedInputDisplay
            expectedInputs={currentBeatData.expectedInput.expectedTypes}
            nextInputs={nextBeatData?.expectedInput.expectedTypes}
          />
        )}

        <div className="h-full flex">
          {shouldShowLeft && (
            <div
              onTouchStart={handleLeftTouch}
              className={`flex-1 transition-all duration-100 flex items-center justify-center border-4 cursor-pointer ${
                leftActive ? 'bg-green-400 border-yellow-300' : 'bg-green-700 border-white'
              }`}
            >
              {currentTest.trainingRange === 'left' && (
                <div className="text-white text-9xl pointer-events-none">
                  {currentTest.bodyPart === 'hand' ? '✋' : '🦶'}
                  <div className="text-4xl mt-4">왼쪽</div>
                </div>
              )}
            </div>
          )}

          {currentTest.trainingRange === 'both' && (
            <div className="flex flex-col items-center justify-center bg-gray-800 px-8 pointer-events-none">
              <div className="text-white text-9xl mb-4">
                {currentTest.bodyPart === 'hand' ? '👐' : '👣'}
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
              {currentTest.trainingRange === 'right' && (
                <div className="text-white text-9xl pointer-events-none">
                  {currentTest.bodyPart === 'hand' ? '🤚' : '🦶'}
                  <div className="text-4xl mt-4">오른쪽</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'testing' && currentTest.trainingType === 'audio') {
    const shouldShowLeft = currentTest.trainingRange === 'left' || currentTest.trainingRange === 'both';
    const shouldShowRight = currentTest.trainingRange === 'right' || currentTest.trainingRange === 'both';

    const handleLeftTouch = (e: React.TouchEvent) => {
      e.preventDefault();
      const inputType = currentTest.bodyPart === 'hand' ? 'left-hand' : 'left-foot';
      handleTouchInput(inputType as InputType);
    };

    const handleRightTouch = (e: React.TouchEvent) => {
      e.preventDefault();
      const inputType = currentTest.bodyPart === 'hand' ? 'right-hand' : 'right-foot';
      handleTouchInput(inputType as InputType);
    };

    return (
      <div className="fixed inset-0 bg-black">
        <div className="absolute top-4 left-4 z-50">
          <div className="text-white text-xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded">
            {currentTest.name} ({currentTestIndex + 1}/{ASSESSMENT_SEQUENCE.length})
          </div>
        </div>

        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
          <div className="text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded">
            {BPM} BPM | {formatTime(timeRemaining)}
          </div>
          <div className="text-white text-lg bg-black bg-opacity-50 px-3 py-2 rounded">
            {currentBeat} / {totalBeats}
          </div>
        </div>

        {currentFeedback && (
          <TimingFeedback
            feedback={currentFeedback}
            currentPoints={currentFeedback.points}
          />
        )}

        {currentBeatData && (
          <ExpectedInputDisplay
            expectedInputs={currentBeatData.expectedInput.expectedTypes}
            nextInputs={nextBeatData?.expectedInput.expectedTypes}
          />
        )}

        <div className="h-full flex">
          {shouldShowLeft && (
            <div
              onTouchStart={handleLeftTouch}
              className="flex-1 transition-all duration-100 flex items-center justify-center border-4 bg-green-700 border-white cursor-pointer"
            >
              {currentTest.trainingRange === 'left' && (
                <div className="text-white text-9xl pointer-events-none">
                  {currentTest.bodyPart === 'hand' ? '✋' : '🦶'}
                  <div className="text-4xl mt-4">왼쪽</div>
                </div>
              )}
            </div>
          )}

          {currentTest.trainingRange === 'both' && (
            <div className="flex flex-col items-center justify-center bg-gray-800 px-8 pointer-events-none">
              <div className="text-white text-9xl mb-4">
                {currentTest.bodyPart === 'hand' ? '👐' : '👣'}
              </div>
              <div className="text-white text-3xl">양쪽</div>
            </div>
          )}

          {shouldShowRight && (
            <div
              onTouchStart={handleRightTouch}
              className="flex-1 transition-all duration-100 flex items-center justify-center border-4 bg-red-700 border-white cursor-pointer"
            >
              {currentTest.trainingRange === 'right' && (
                <div className="text-white text-9xl pointer-events-none">
                  {currentTest.bodyPart === 'hand' ? '🤚' : '🦶'}
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

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black flex items-center justify-center text-white text-2xl">로딩중...</div>}>
      <AssessmentContent />
    </Suspense>
  );
}
