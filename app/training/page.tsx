'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrainingType, BodyPart, TrainingRange } from '@/types';

function TrainingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const trainingType = searchParams.get('trainingType') as TrainingType;
  const bodyPart = searchParams.get('bodyPart') as BodyPart;
  const trainingRange = searchParams.get('trainingRange') as TrainingRange;
  const bpm = parseInt(searchParams.get('bpm') || '60');
  const duration = parseInt(searchParams.get('duration') || '1');

  const [isRunning, setIsRunning] = useState(false);
  const [currentSide, setCurrentSide] = useState<'left' | 'right'>('left');
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);

  const intervalMs = 60000 / bpm;

  const playBeep = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  useEffect(() => {
    setIsRunning(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, router]);

  useEffect(() => {
    if (!isRunning) return;

    const beatInterval = setInterval(() => {
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
    }, intervalMs);

    return () => clearInterval(beatInterval);
  }, [isRunning, trainingType, trainingRange, intervalMs, playBeep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExit = () => {
    router.push('/');
  };

  if (trainingType === 'visual') {
    const shouldShowLeft = trainingRange === 'left' || trainingRange === 'both';
    const shouldShowRight = trainingRange === 'right' || trainingRange === 'both';
    const leftActive = isActive && (trainingRange === 'left' || (trainingRange === 'both' && currentSide === 'left'));
    const rightActive = isActive && (trainingRange === 'right' || (trainingRange === 'both' && currentSide === 'right'));

    return (
      <div className="fixed inset-0 bg-black">
        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
          <div className="text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded">
            {bpm} BPM | {formatTime(timeRemaining)}
          </div>
          <button
            onClick={handleExit}
            className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="h-full flex">
          {shouldShowLeft && (
            <div
              className={`flex-1 transition-all duration-100 flex items-center justify-center border-4 ${
                leftActive ? 'bg-green-400 border-yellow-300' : 'bg-green-700 border-white'
              }`}
            >
              {trainingRange === 'left' && (
                <div className="text-white text-9xl">
                  {bodyPart === 'hand' ? '✋' : '🦶'}
                  <div className="text-4xl mt-4">왼쪽</div>
                </div>
              )}
            </div>
          )}

          {trainingRange === 'both' && (
            <div className="flex flex-col items-center justify-center bg-gray-800 px-8">
              <div className="text-white text-9xl mb-4">
                {bodyPart === 'hand' ? '👐' : '👣'}
              </div>
              <div className="text-white text-3xl">양쪽</div>
            </div>
          )}

          {shouldShowRight && (
            <div
              className={`flex-1 transition-all duration-100 flex items-center justify-center border-4 ${
                rightActive ? 'bg-red-400 border-yellow-300' : 'bg-red-700 border-white'
              }`}
            >
              {trainingRange === 'right' && (
                <div className="text-white text-9xl">
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

  if (trainingType === 'audio') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 to-purple-900 flex flex-col items-center justify-center">
        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
          <div className="text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded">
            {bpm} BPM | {formatTime(timeRemaining)}
          </div>
          <button
            onClick={handleExit}
            className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="text-center">
          <div className="text-white text-9xl mb-8">🔊</div>
          <h1 className="text-white text-5xl font-bold mb-4">청각 훈련 모드</h1>
          <p className="text-white text-2xl opacity-80">소리에 맞춰 연습하세요</p>
          <div className="mt-8 text-white text-3xl">
            {bodyPart === 'hand' ? '손' : '발'} - {trainingRange === 'left' ? '왼쪽' : trainingRange === 'right' ? '오른쪽' : '양쪽'}
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
