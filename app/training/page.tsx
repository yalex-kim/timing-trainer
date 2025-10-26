'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrainingType, CustomBodyPart } from '@/types';
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

// Body part configuration
const BODY_PART_CONFIG = {
  'left-hand': {
    label: '왼손',
    icon: '✋',
    color: {
      bg: 'bg-blue-500',
      bgActive: 'bg-blue-300',
      border: 'border-blue-600',
    }
  },
  'right-hand': {
    label: '오른손',
    icon: '🤚',
    color: {
      bg: 'bg-red-500',
      bgActive: 'bg-red-300',
      border: 'border-red-600',
    }
  },
  'left-foot': {
    label: '왼발',
    icon: '🦶',
    color: {
      bg: 'bg-green-500',
      bgActive: 'bg-green-300',
      border: 'border-green-600',
    }
  },
  'right-foot': {
    label: '오른발',
    icon: '🦶',
    color: {
      bg: 'bg-yellow-500',
      bgActive: 'bg-yellow-300',
      border: 'border-yellow-600',
    }
  },
};

function TrainingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const trainingType = searchParams.get('trainingType') as TrainingType;
  const bpm = parseInt(searchParams.get('bpm') || '60');
  const duration = parseInt(searchParams.get('duration') || '1');
  const customSequenceParam = searchParams.get('customSequence');

  // Parse custom sequence
  const customSequence: CustomBodyPart[] = customSequenceParam ? JSON.parse(customSequenceParam) : [];

  // State management
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<TimingFeedbackType | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);

  // Visual training state
  const [activeBodyParts, setActiveBodyParts] = useState<Set<CustomBodyPart>>(new Set());

  // User profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const intervalMs = 60000 / bpm;
  const totalBeats = Math.floor((duration * 60 * 1000) / intervalMs);
  const startTimeRef = useRef<number>(0);
  const sessionRef = useRef<TrainingSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentBeatRef = useRef<number>(0);
  const customSequenceRef = useRef<CustomBodyPart[]>(customSequence);

  // Sync refs
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    currentBeatRef.current = currentBeat;
  }, [currentBeat]);

  useEffect(() => {
    customSequenceRef.current = customSequence;
  }, [customSequence]);

  // Load user profile
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

  // AudioContext initialization
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

  // Audio beep
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

  // Initialize session
  useEffect(() => {
    if (!userProfile || customSequence.length === 0) return;

    startTimeRef.current = performance.now();
    const beats: BeatData[] = [];

    // Generate beats with custom sequence pattern
    for (let i = 0; i < totalBeats; i++) {
      const sequenceIndex = i % customSequence.length;
      const bodyPart = customSequence[sequenceIndex];

      // Convert CustomBodyPart to expected input
      const expectedTypes: InputType[] = [bodyPart as InputType];

      beats.push({
        beatNumber: i,
        expectedTime: i * intervalMs,
        expectedInput: {
          expectedTypes,
          description: BODY_PART_CONFIG[bodyPart].label,
        },
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
        bodyPart: 'hand', // Dummy value for compatibility
        trainingRange: 'both', // Dummy value
        bpm,
        durationMinutes: duration,
        pattern: customSequence, // Store custom sequence as pattern
        customSequence,
      },
      beats,
    };

    setSession(newSession);
    setIsRunning(true);
  }, [totalBeats, intervalMs, trainingType, bpm, duration, userProfile, customSequence]);

  // Input handling
  const handleInput = useCallback((inputEvent: InputEvent) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

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
  }, [intervalMs]);

  // Input handler registration
  useInputHandler({
    onInput: handleInput,
    enableKeyboard: true,
  });

  // Touch input handler
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

  // Beat progression
  useEffect(() => {
    if (!isRunning) return;

    const beatTimer = setInterval(() => {
      const currentBeatValue = currentBeatRef.current;
      const sequence = customSequenceRef.current;

      // Audio effect
      if (trainingType === 'audio') {
        playBeep();
      }

      // Visual effect
      if (trainingType === 'visual') {
        const sequenceIndex = currentBeatValue % sequence.length;
        const activePart = sequence[sequenceIndex];
        setActiveBodyParts(new Set([activePart]));
        setCurrentSequenceIndex(sequenceIndex);

        setTimeout(() => {
          setActiveBodyParts(new Set());
        }, intervalMs * 0.3);
      }

      // Check previous beat for miss
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
          setTimeout(() => finishSession(), 500);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(beatTimer);
  }, [isRunning, intervalMs, totalBeats, trainingType, playBeep, finishSession]);

  // Timer
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

  // ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Finish session
  const finishSession = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    setIsRunning(false);

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
  }, []);

  // Time formatting
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

  // Results screen
  if (showResults && session?.results) {
    return (
      <SessionResults
        results={session.results}
        onRestart={handleRestart}
        onExit={handleExit}
      />
    );
  }

  // Calculate layout mode
  const getLayoutMode = (): '2-split-horizontal' | '2-split-vertical' | '4-split' => {
    if (customSequence.length <= 2) {
      const hands = customSequence.filter(p => p.includes('hand')).length;
      const feet = customSequence.filter(p => p.includes('foot')).length;
      const lefts = customSequence.filter(p => p.includes('left')).length;
      const rights = customSequence.filter(p => p.includes('right')).length;

      // Same side (left-hand + left-foot OR right-hand + right-foot)
      if ((lefts === 2 && rights === 0) || (rights === 2 && lefts === 0)) {
        return '2-split-horizontal'; // Top-bottom split
      }
      // Same type (hands only OR feet only)
      else if ((hands === 2 && feet === 0) || (feet === 2 && hands === 0)) {
        return '2-split-vertical'; // Left-right split
      }
      // Mixed
      return '2-split-vertical';
    }
    return '4-split';
  };

  const layoutMode = getLayoutMode();
  const currentBeatData = session?.beats[currentBeat];
  const nextBeatData = session?.beats[currentBeat + 1];

  // Render training UI
  return (
    <div className="fixed inset-0 bg-black">
      {/* Top info */}
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

      {/* Visual areas */}
      {layoutMode === '4-split' && (
        <div className="h-full grid grid-cols-2 grid-rows-2">
          {/* Top-left: Left hand */}
          {customSequence.includes('left-hand') && (
            <div
              onTouchStart={() => handleTouchInput('left-hand')}
              className={`flex items-center justify-center border-4 cursor-pointer transition-all duration-100 ${
                activeBodyParts.has('left-hand')
                  ? `${BODY_PART_CONFIG['left-hand'].color.bgActive} border-yellow-300`
                  : `${BODY_PART_CONFIG['left-hand'].color.bg} ${BODY_PART_CONFIG['left-hand'].color.border}`
              }`}
            >
              <div className="text-white text-center pointer-events-none">
                <div className="text-7xl mb-2">{BODY_PART_CONFIG['left-hand'].icon}</div>
                <div className="text-3xl font-bold">{BODY_PART_CONFIG['left-hand'].label}</div>
              </div>
            </div>
          )}

          {/* Top-right: Right hand */}
          {customSequence.includes('right-hand') && (
            <div
              onTouchStart={() => handleTouchInput('right-hand')}
              className={`flex items-center justify-center border-4 cursor-pointer transition-all duration-100 ${
                activeBodyParts.has('right-hand')
                  ? `${BODY_PART_CONFIG['right-hand'].color.bgActive} border-yellow-300`
                  : `${BODY_PART_CONFIG['right-hand'].color.bg} ${BODY_PART_CONFIG['right-hand'].color.border}`
              }`}
            >
              <div className="text-white text-center pointer-events-none">
                <div className="text-7xl mb-2">{BODY_PART_CONFIG['right-hand'].icon}</div>
                <div className="text-3xl font-bold">{BODY_PART_CONFIG['right-hand'].label}</div>
              </div>
            </div>
          )}

          {/* Bottom-left: Left foot */}
          {customSequence.includes('left-foot') && (
            <div
              onTouchStart={() => handleTouchInput('left-foot')}
              className={`flex items-center justify-center border-4 cursor-pointer transition-all duration-100 ${
                activeBodyParts.has('left-foot')
                  ? `${BODY_PART_CONFIG['left-foot'].color.bgActive} border-yellow-300`
                  : `${BODY_PART_CONFIG['left-foot'].color.bg} ${BODY_PART_CONFIG['left-foot'].color.border}`
              }`}
            >
              <div className="text-white text-center pointer-events-none">
                <div className="text-7xl mb-2">{BODY_PART_CONFIG['left-foot'].icon}</div>
                <div className="text-3xl font-bold">{BODY_PART_CONFIG['left-foot'].label}</div>
              </div>
            </div>
          )}

          {/* Bottom-right: Right foot */}
          {customSequence.includes('right-foot') && (
            <div
              onTouchStart={() => handleTouchInput('right-foot')}
              className={`flex items-center justify-center border-4 cursor-pointer transition-all duration-100 ${
                activeBodyParts.has('right-foot')
                  ? `${BODY_PART_CONFIG['right-foot'].color.bgActive} border-yellow-300`
                  : `${BODY_PART_CONFIG['right-foot'].color.bg} ${BODY_PART_CONFIG['right-foot'].color.border}`
              }`}
            >
              <div className="text-white text-center pointer-events-none">
                <div className="text-7xl mb-2">{BODY_PART_CONFIG['right-foot'].icon}</div>
                <div className="text-3xl font-bold">{BODY_PART_CONFIG['right-foot'].label}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2-split layouts */}
      {layoutMode === '2-split-vertical' && (
        <div className="h-full flex">
          {customSequence.map((part, index) => (
            <div
              key={index}
              onTouchStart={() => handleTouchInput(part as InputType)}
              className={`flex-1 flex items-center justify-center border-4 cursor-pointer transition-all duration-100 ${
                activeBodyParts.has(part)
                  ? `${BODY_PART_CONFIG[part].color.bgActive} border-yellow-300`
                  : `${BODY_PART_CONFIG[part].color.bg} ${BODY_PART_CONFIG[part].color.border}`
              }`}
            >
              <div className="text-white text-center pointer-events-none">
                <div className="text-8xl mb-4">{BODY_PART_CONFIG[part].icon}</div>
                <div className="text-4xl font-bold">{BODY_PART_CONFIG[part].label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {layoutMode === '2-split-horizontal' && (
        <div className="h-full flex flex-col">
          {customSequence.map((part, index) => (
            <div
              key={index}
              onTouchStart={() => handleTouchInput(part as InputType)}
              className={`flex-1 flex items-center justify-center border-4 cursor-pointer transition-all duration-100 ${
                activeBodyParts.has(part)
                  ? `${BODY_PART_CONFIG[part].color.bgActive} border-yellow-300`
                  : `${BODY_PART_CONFIG[part].color.bg} ${BODY_PART_CONFIG[part].color.border}`
              }`}
            >
              <div className="text-white text-center pointer-events-none">
                <div className="text-8xl mb-4">{BODY_PART_CONFIG[part].icon}</div>
                <div className="text-4xl font-bold">{BODY_PART_CONFIG[part].label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrainingPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black flex items-center justify-center text-white text-2xl">로딩중...</div>}>
      <TrainingContent />
    </Suspense>
  );
}
