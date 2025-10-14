'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrainingSettings, DEFAULT_SETTINGS } from '@/types';

export default function Home() {
  const router = useRouter();
  const [settings, setSettings] = useState<TrainingSettings>(DEFAULT_SETTINGS);

  const handleStart = () => {
    const params = new URLSearchParams({
      trainingType: settings.trainingType,
      bodyPart: settings.bodyPart,
      trainingRange: settings.trainingRange,
      bpm: settings.bpm.toString(),
      duration: settings.durationMinutes.toString(),
    });
    router.push(`/training?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          타이밍 훈련 프로그램
        </h1>

        <div className="space-y-6">
          {/* 훈련 타입 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              훈련 타입
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSettings({ ...settings, trainingType: 'visual' })}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  settings.trainingType === 'visual'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                시각 훈련
              </button>
              <button
                onClick={() => setSettings({ ...settings, trainingType: 'audio' })}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  settings.trainingType === 'audio'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                청각 훈련
              </button>
            </div>
          </div>

          {/* 신체 부위 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              신체 부위
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSettings({ ...settings, bodyPart: 'hand' })}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  settings.bodyPart === 'hand'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                손
              </button>
              <button
                onClick={() => setSettings({ ...settings, bodyPart: 'foot' })}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  settings.bodyPart === 'foot'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                발
              </button>
            </div>
          </div>

          {/* 훈련 범위 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              훈련 범위
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSettings({ ...settings, trainingRange: 'left' })}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  settings.trainingRange === 'left'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                왼쪽
              </button>
              <button
                onClick={() => setSettings({ ...settings, trainingRange: 'both' })}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  settings.trainingRange === 'both'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                양쪽
              </button>
              <button
                onClick={() => setSettings({ ...settings, trainingRange: 'right' })}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  settings.trainingRange === 'right'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                오른쪽
              </button>
            </div>
          </div>

          {/* BPM 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BPM: {settings.bpm}
            </label>
            <input
              type="range"
              min="40"
              max="200"
              value={settings.bpm}
              onChange={(e) => setSettings({ ...settings, bpm: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>40</span>
              <span>200</span>
            </div>
          </div>

          {/* 훈련 시간 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              훈련 시간: {settings.durationMinutes}분
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={settings.durationMinutes}
              onChange={(e) => setSettings({ ...settings, durationMinutes: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1분</span>
              <span>5분</span>
            </div>
          </div>

          {/* 시작 버튼 */}
          <button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
          >
            훈련 시작
          </button>
        </div>
      </div>
    </div>
  );
}
