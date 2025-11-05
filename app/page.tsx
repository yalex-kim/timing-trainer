'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrainingSettings, DEFAULT_SETTINGS, CustomBodyPart } from '@/types';
import { UserProfile } from '@/types/evaluation';
import { calculateAge } from '@/utils/evaluator';
import { getBodyPartLabel, getBodyPartIcon } from '@/utils/bodyPartColors';

export default function Home() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [mode, setMode] = useState<'training' | 'assessment' | null>(null);
  const [settings, setSettings] = useState<TrainingSettings>(DEFAULT_SETTINGS);

  // 기본 생년월일 계산 (현 시점 기준 6년 전)
  const getDefaultBirthDate = () => {
    const today = new Date();
    const sixYearsAgo = new Date(today.getFullYear() - 6, today.getMonth(), today.getDate());
    return sixYearsAgo.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  };

  // 폼 입력 상태
  const [formData, setFormData] = useState({
    name: '',
    birthDate: getDefaultBirthDate(),
    gender: 'male' as 'male' | 'female',
  });

  // LocalStorage에서 사용자 정보 로드
  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const profile = JSON.parse(stored) as UserProfile;
      profile.age = calculateAge(profile.birthDate);
      setUserProfile(profile);
    } else {
      setShowUserForm(true);
    }
  }, []);

  // 사용자 정보 저장
  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profile: UserProfile = {
      ...formData,
      age: calculateAge(formData.birthDate),
    };
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setUserProfile(profile);
    setShowUserForm(false);
  };

  // 사용자 정보 수정
  const handleEditUser = () => {
    if (userProfile) {
      setFormData({
        name: userProfile.name,
        birthDate: userProfile.birthDate,
        gender: userProfile.gender,
      });
    }
    setShowUserForm(true);
  };

  // 커스텀 시퀀스 추가
  const addToSequence = (part: CustomBodyPart) => {
    const currentSequence = settings.customSequence || [];
    if (currentSequence.length >= 4) {
      alert('최대 4개까지만 선택 가능합니다.');
      return;
    }
    if (currentSequence.includes(part)) {
      return; // 이미 선택된 항목은 무시
    }
    setSettings({
      ...settings,
      customSequence: [...currentSequence, part],
    });
  };

  // 커스텀 시퀀스에서 제거
  const removeFromSequence = (index: number) => {
    const currentSequence = settings.customSequence || [];
    const newSequence = currentSequence.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      customSequence: newSequence.length > 0 ? newSequence : undefined,
    });
  };

  // 커스텀 시퀀스 초기화
  const clearSequence = () => {
    setSettings({
      ...settings,
      customSequence: undefined,
    });
  };

  // 훈련/검사 시작
  const handleStart = () => {
    if (!userProfile) {
      alert('사용자 정보를 먼저 입력해주세요.');
      return;
    }

    if (mode === 'assessment') {
      router.push('/assessment');
    } else {
      // 훈련 모드: 커스텀 시퀀스가 필수
      if (!settings.customSequence || settings.customSequence.length === 0) {
        alert('훈련할 순서를 선택해주세요. (최소 1개 이상)');
        return;
      }

      const params = new URLSearchParams({
        trainingType: settings.trainingType,
        bodyPart: settings.bodyPart,
        trainingRange: settings.trainingRange,
        bpm: settings.bpm.toString(),
        duration: settings.durationMinutes.toString(),
      });

      // 커스텀 시퀀스 추가
      params.set('customSequence', JSON.stringify(settings.customSequence));

      router.push(`/training?${params.toString()}`);
    }
  };

  // 사용자 정보 입력 화면
  if (showUserForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            사용자 정보 입력
          </h1>

          <form onSubmit={handleUserFormSubmit} className="space-y-6">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="홍길동"
              />
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                생년월일
              </label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성별
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                    formData.gender === 'male'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                    formData.gender === 'female'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  여성
                </button>
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
            >
              {userProfile ? '정보 수정 완료' : '다음 단계로'}
            </button>

            {userProfile && (
              <button
                type="button"
                onClick={() => setShowUserForm(false)}
                className="w-full bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 transition-all"
              >
                취소
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // 훈련 설정 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {/* 사용자 정보 표시 */}
        {userProfile && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">훈련자</div>
                <div className="text-lg font-bold text-gray-800">{userProfile.name}</div>
                <div className="text-sm text-gray-600">만 {userProfile.age}세</div>
              </div>
              <button
                onClick={handleEditUser}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                수정
              </button>
            </div>
          </div>
        )}

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          타이밍 훈련 프로그램
        </h1>

        <div className="space-y-6">
          {/* 모드 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              모드 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('training')}
                className={`py-4 px-4 rounded-lg font-bold text-lg transition-colors ${
                  mode === 'training'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                훈련 모드
              </button>
              <button
                onClick={() => setMode('assessment')}
                className={`py-4 px-4 rounded-lg font-bold text-lg transition-colors ${
                  mode === 'assessment'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                검사 모드
              </button>
            </div>
          </div>

          {/* 검사 기준표 보기 버튼 */}
          <div>
            <button
              onClick={() => router.push('/standards')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 border-2 border-gray-300 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>📊</span>
              <span>연령별 검사 기준표 보기</span>
            </button>
          </div>

          {mode === 'training' && (
            <>
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

          {/* 커스텀 시퀀스 선택 */}
          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                훈련 순서 선택
              </label>
              {settings.customSequence && settings.customSequence.length > 0 && (
                <button
                  onClick={clearSequence}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  초기화
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-3">
              최대 4개까지 선택 가능 (중복 불가)
            </p>

            {/* 신체 부위 선택 버튼 */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(['left-hand', 'right-hand', 'left-foot', 'right-foot'] as CustomBodyPart[]).map((part) => {
                const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
                const isSelected = settings.customSequence?.includes(part);
                const isDisabled = isSelected;

                return (
                  <button
                    key={part}
                    onClick={() => addToSequence(part)}
                    disabled={isDisabled}
                    className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      isDisabled
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <span>{getBodyPartIcon(type as 'hand' | 'foot', side)}</span>
                    <span>{getBodyPartLabel(type as 'hand' | 'foot', side)}</span>
                  </button>
                );
              })}
            </div>

            {/* 선택된 시퀀스 표시 */}
            {settings.customSequence && settings.customSequence.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-gray-600 mb-2 font-medium">선택된 순서:</div>
                <div className="flex flex-wrap gap-2">
                  {settings.customSequence.map((part, index) => {
                    const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
                    return (
                      <div key={index} className="flex items-center gap-1">
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-blue-300">
                          <span className="text-sm">{index + 1}.</span>
                          <span>{getBodyPartIcon(type as 'hand' | 'foot', side)}</span>
                          <span className="text-sm font-medium">{getBodyPartLabel(type as 'hand' | 'foot', side)}</span>
                          <button
                            onClick={() => removeFromSequence(index)}
                            className="ml-1 text-red-500 hover:text-red-700 font-bold text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        {index < settings.customSequence!.length - 1 && (
                          <span className="text-gray-400">→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

            </>
          )}

          {/* 검사 모드 안내 */}
          {mode === 'assessment' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-bold text-green-800 mb-2">검사 모드</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• BPM: 60 (고정)</li>
                <li>• 8가지 검사를 순서대로 진행합니다</li>
                <li>• 왼손(청각) → 왼손(시각) → 오른손(청각) → 오른손(시각)</li>
                <li>• 왼발(청각) → 왼발(시각) → 오른발(청각) → 오른발(시각)</li>
              </ul>
            </div>
          )}

          {/* 시작 버튼 */}
          {mode && (
            <button
              onClick={handleStart}
              disabled={mode === 'training' && (!settings.customSequence || settings.customSequence.length === 0)}
              className={`w-full text-white py-4 px-6 rounded-lg font-bold text-lg transition-all shadow-lg ${
                mode === 'training' && (!settings.customSequence || settings.customSequence.length === 0)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : mode === 'training'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:shadow-xl'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:shadow-xl'
              }`}
            >
              {mode === 'training' ? '훈련 시작' : '검사 시작'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
