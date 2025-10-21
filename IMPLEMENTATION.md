# Timing Evaluation System - Implementation Guide

## 개요

Interactive Metronome (IM) 연구 기반의 타이밍 평가 시스템입니다. 4가지 독립적인 입력(왼손, 오른손, 왼발, 오른발)을 받아 정확한 타이밍 평가와 피드백을 제공합니다.

---

## 📁 파일 구조

```
timing-trainer/
├── types/
│   ├── index.ts                 # 기본 타입 (기존)
│   └── evaluation.ts            # 평가 시스템 타입 (NEW)
├── utils/
│   └── evaluator.ts             # 평가 로직 (NEW)
├── hooks/
│   └── useInputHandler.ts       # 입력 처리 훅 (NEW)
├── components/
│   ├── TimingFeedback.tsx       # 실시간 피드백 컴포넌트 (NEW)
│   └── SessionResults.tsx       # 결과 화면 컴포넌트 (NEW)
├── app/
│   ├── page.tsx                 # 메인 설정 화면
│   ├── training/page.tsx        # 훈련 화면 (수정 필요)
│   └── globals.css              # 애니메이션 추가됨
```

---

## 🎯 핵심 개념

### 1. 4가지 독립 입력

```typescript
type InputType = 'left-hand' | 'right-hand' | 'left-foot' | 'right-foot';
```

모든 입력은 다음 정보를 포함합니다:
- **type**: 입력 종류
- **timestamp**: 입력 시간 (ms)
- **source**: 입력 소스 (keyboard/usb/midi/gamepad)
- **rawData**: 원본 디바이스 데이터

### 2. IM 기반 평가 지표

#### Task Average (TA)
- **정의**: 모든 비트에 대한 평균 타이밍 편차 (ms)
- **계산**: `Σ|실제시간 - 예상시간| / 총 비트 수`
- **해석**: 낮을수록 좋음 (0 = 완벽)

#### Class Level (1-7)
| Class | 레벨 | TA 범위 |
|-------|------|---------|
| 7 | 최상급 | 0-20ms |
| 6 | 뛰어남 | 20-40ms |
| 5 | 평균 이상 | 40-80ms |
| 4 | 평균 | 80-120ms |
| 3 | 평균 이하 | 120-180ms |
| 2 | 심각한 결핍 | 180-250ms |
| 1 | 극심한 결핍 | 250ms+ |

#### Early/Late Hit 분포
- **Early Hit %**: 조기 반응 비율
- **Late Hit %**: 지연 반응 비율
- **목표**: 50/50 균형

### 3. 실시간 피드백 등급

| 등급 | 범위 | 점수 | 색상 |
|------|------|------|------|
| Perfect | ±15ms | 100 | 초록 |
| Excellent | ±30ms | 90 | 연두 |
| Good | ±50ms | 75 | 황록 |
| Fair | ±80ms | 60 | 노랑 |
| Poor | ±120ms | 40 | 주황 |
| Miss | 120ms+ | 0 | 빨강 |

---

## 🔧 주요 컴포넌트

### 1. 평가 시스템 (`utils/evaluator.ts`)

#### PatternGenerator
훈련 패턴에 따라 예상 입력을 생성합니다.

```typescript
// 사용 예시
const expected = PatternGenerator.generateExpectedInput(
  'both-hands-alternate',
  beatNumber
);
// 결과: { expectedTypes: ['left-hand'], isAlternating: true, ... }
```

**지원 패턴**:
- `left-hand-only` / `right-hand-only`
- `both-hands-alternate` / `both-hands-simultaneous`
- `left-foot-only` / `right-foot-only`
- `both-feet-alternate` / `both-feet-simultaneous`
- `left-hand-right-foot` (크로스 훈련)
- `right-hand-left-foot` (크로스 훈련)
- `all-alternate` (4개 모두 순환)

#### TimingEvaluator
타이밍을 평가하고 점수를 계산합니다.

```typescript
// 단일 비트 평가
const { feedback, isCorrectInput } = TimingEvaluator.evaluateBeat(
  expectedTime,
  actualTime,
  inputType,
  expected
);

// 세션 전체 평가
const results = TimingEvaluator.evaluateSession(beats);
// 결과: { taskAverage, classLevel, earlyHitPercent, ... }
```

**주요 기능**:
- 입력 검증 (올바른 신체 부위인지)
- 타이밍 평가 (편차 계산)
- 피드백 등급 결정
- TA, Class, Early/Late 분포 계산
- 일관성 점수 계산 (표준편차 기반)

#### InputMapper
다양한 입력 소스를 InputType으로 변환합니다.

```typescript
// 키보드
const type = InputMapper.keyToInputType('a'); // 'left-hand'

// MIDI
const type = InputMapper.midiNoteToInputType(60); // 'left-hand'

// USB HID
const type = InputMapper.hidButtonToInputType(0); // 'left-hand'

// Gamepad
const type = InputMapper.gamepadButtonToInputType(0); // 'left-hand'
```

### 2. 입력 처리 훅 (`hooks/useInputHandler.ts`)

4가지 입력 소스를 처리하는 React Hook입니다.

```typescript
useInputHandler({
  onInput: (inputEvent) => {
    console.log(inputEvent.type); // 'left-hand', 'right-hand', etc.
    console.log(inputEvent.timestamp); // ms
  },
  enableKeyboard: true,
  enableMIDI: false,
  enableHID: false,
  enableGamepad: false,
});
```

**지원 입력 소스**:

#### Keyboard (기본값)
- 왼손: `A`, `Q`
- 오른손: `D`, `E`
- 왼발: `Z`, `X`
- 오른발: `C`, `V`

#### Web MIDI API
- MIDI 키보드, 전자 드럼 등
- 노트 번호 커스터마이징 가능

#### Web HID API
- USB 게임 컨트롤러, 페달 등
- 사용자가 디바이스 선택 필요

#### Gamepad API
- Xbox, PlayStation 컨트롤러 등
- 60Hz 폴링

### 3. UI 컴포넌트

#### TimingFeedback (`components/TimingFeedback.tsx`)

실시간 피드백을 표시합니다.

```tsx
<TimingFeedback
  feedback={currentFeedback}
  streak={5}
  currentPoints={100}
  averagePoints={85.5}
  showStreak={true}
/>
```

**표시 항목**:
- 피드백 등급 (PERFECT, GOOD 등)
- 편차 (+15ms, -10ms 등)
- 방향 표시 (빠름/느림)
- 현재 점수
- 연속 성공 횟수 (3회 이상)
- 평균 점수

#### WrongInputAlert
잘못된 입력 경고를 표시합니다.

```tsx
<WrongInputAlert
  show={true}
  expectedInput="왼손"
  actualInput="오른손"
/>
```

#### ProgressIndicator
훈련 진행도를 표시합니다.

```tsx
<ProgressIndicator
  currentBeat={50}
  totalBeats={100}
  timeRemaining="2:30"
  bpm={120}
/>
```

#### ExpectedInputDisplay
다음 예상 입력을 표시합니다.

```tsx
<ExpectedInputDisplay
  expectedInputs={['left-hand']}
  nextInputs={['right-hand']}
/>
```

#### SessionResults (`components/SessionResults.tsx`)

훈련 종료 후 결과를 표시합니다.

```tsx
<SessionResults
  results={sessionResults}
  onRestart={() => { /* 재시작 */ }}
  onExit={() => { /* 메인으로 */ }}
/>
```

**표시 항목**:
- Task Average (TA)
- Class Level
- 종합 점수, 일관성, 응답률
- Early/Late 분포 (막대 그래프)
- 피드백 분포 (Perfect, Good 등)
- 신체 부위별 통계
- 오류 정보 (놓친 비트, 잘못된 입력)
- 개선도 (이전 세션 대비)

---

## 🚀 통합 가이드

### 기존 훈련 화면에 통합하기

`app/training/page.tsx`를 다음과 같이 수정합니다:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInputHandler } from '@/hooks/useInputHandler';
import { PatternGenerator, TimingEvaluator } from '@/utils/evaluator';
import {
  BeatData,
  InputEvent,
  TrainingSession,
  SessionResults as SessionResultsType,
} from '@/types/evaluation';
import TimingFeedback from '@/components/TimingFeedback';
import SessionResults from '@/components/SessionResults';
import { ProgressIndicator, ExpectedInputDisplay } from '@/components/TimingFeedback';

function TrainingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 설정 가져오기
  const trainingType = searchParams.get('trainingType') as 'visual' | 'audio';
  const bodyPart = searchParams.get('bodyPart') as 'hand' | 'foot';
  const trainingRange = searchParams.get('trainingRange') as 'left' | 'right' | 'both';
  const bpm = parseInt(searchParams.get('bpm') || '60');
  const duration = parseInt(searchParams.get('duration') || '1');

  // 훈련 패턴 결정
  const pattern = PatternGenerator.settingsToPattern(bodyPart, trainingRange);

  // 상태
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);

  const intervalMs = 60000 / bpm;
  const totalBeats = Math.floor((duration * 60 * 1000) / intervalMs);

  // 세션 초기화
  useEffect(() => {
    const startTime = performance.now();
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

    setSession({
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
    });

    setIsRunning(true);
  }, []);

  // 입력 처리
  const handleInput = useCallback((inputEvent: InputEvent) => {
    if (!session || !isRunning) return;

    const currentBeatData = session.beats[currentBeat];
    if (!currentBeatData) return;

    // 평가
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

    setSession((prev) => {
      if (!prev) return prev;
      const newBeats = [...prev.beats];
      newBeats[currentBeat] = updatedBeat;
      return { ...prev, beats: newBeats };
    });

    // 피드백 표시
    setCurrentFeedback(feedback);
    setTimeout(() => setCurrentFeedback(null), 1000);

    // 다음 비트로
    if (currentBeat + 1 >= totalBeats) {
      // 훈련 종료
      finishSession();
    }
  }, [session, currentBeat, isRunning]);

  // 입력 핸들러 등록
  useInputHandler({
    onInput: handleInput,
    enableKeyboard: true,
  });

  // 비트 진행
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setCurrentBeat((prev) => {
        if (prev + 1 >= totalBeats) {
          clearInterval(timer);
          finishSession();
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, intervalMs, totalBeats]);

  // 타이머
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

  // 세션 종료
  const finishSession = () => {
    if (!session) return;

    setIsRunning(false);
    const results = TimingEvaluator.evaluateSession(session.beats);
    setSession((prev) => (prev ? { ...prev, results, endTime: Date.now() } : prev));
    setShowResults(true);
  };

  // ESC 키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // 결과 화면
  if (showResults && session?.results) {
    return (
      <SessionResults
        results={session.results}
        onRestart={() => window.location.reload()}
        onExit={() => router.push('/')}
      />
    );
  }

  // 훈련 화면
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentBeatData = session?.beats[currentBeat];
  const nextBeatData = session?.beats[currentBeat + 1];

  return (
    <div className="fixed inset-0 bg-black">
      {/* 진행도 */}
      <ProgressIndicator
        currentBeat={currentBeat}
        totalBeats={totalBeats}
        timeRemaining={formatTime(timeRemaining)}
        bpm={bpm}
      />

      {/* 실시간 피드백 */}
      {currentFeedback && <TimingFeedback feedback={currentFeedback} />}

      {/* 예상 입력 표시 */}
      {currentBeatData && (
        <ExpectedInputDisplay
          expectedInputs={currentBeatData.expectedInput.expectedTypes}
          nextInputs={nextBeatData?.expectedInput.expectedTypes}
        />
      )}

      {/* 기존 시각/청각 훈련 UI */}
      {/* ... */}
    </div>
  );
}

export default function TrainingPage() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <TrainingContent />
    </Suspense>
  );
}
```

---

## 🎹 입력 디바이스 설정

### 1. 키보드 (기본)
설정 불필요, 즉시 사용 가능

### 2. MIDI 디바이스
```typescript
useInputHandler({
  onInput: handleInput,
  enableKeyboard: true,
  enableMIDI: true,  // 활성화
});
```

**노트 매핑 커스터마이징**:
`utils/evaluator.ts`의 `midiNoteToInputType` 함수 수정

### 3. USB HID 디바이스
```typescript
useInputHandler({
  onInput: handleInput,
  enableHID: true,  // 활성화
});
```

**주의**: 사용자가 디바이스 선택 필요 (버튼 클릭 등)

### 4. Gamepad
```typescript
useInputHandler({
  onInput: handleInput,
  enableGamepad: true,  // 활성화
});
```

---

## 📊 데이터 저장

### LocalStorage 사용 예시

```typescript
// 세션 저장
const saveSession = (session: TrainingSession) => {
  const history = JSON.parse(localStorage.getItem('training-history') || '[]');
  history.push(session);
  localStorage.setItem('training-history', JSON.stringify(history));
};

// 세션 불러오기
const loadHistory = (): TrainingSession[] => {
  return JSON.parse(localStorage.getItem('training-history') || '[]');
};

// 통계 계산
const calculateOverallStats = (history: TrainingSession[]) => {
  const allResults = history.map(s => s.results).filter(Boolean);
  const bestTA = Math.min(...allResults.map(r => r!.taskAverage));
  const averageTA = allResults.reduce((sum, r) => sum + r!.taskAverage, 0) / allResults.length;
  // ...
};
```

---

## 🧪 테스트

### 키보드 입력 테스트

1. `npm run dev`
2. 훈련 시작
3. 다음 키를 눌러 테스트:
   - `A`: 왼손
   - `D`: 오른손
   - `Z`: 왼발
   - `C`: 오른발

### MIDI 디바이스 테스트

1. MIDI 디바이스 연결
2. `enableMIDI: true` 설정
3. 노트 연주 → 콘솔 확인

### 평가 시스템 테스트

```typescript
// 샘플 데이터로 테스트
const testBeats: BeatData[] = [/* ... */];
const results = TimingEvaluator.evaluateSession(testBeats);
console.log(results);
```

---

## 🔍 트러블슈팅

### 입력이 인식되지 않음
1. 콘솔에서 입력 이벤트 확인
2. `InputMapper` 매핑 확인
3. `enableKeyboard` 등 플래그 확인

### 타이밍이 부정확함
1. `performance.now()` 사용 확인
2. 세션 시작 시간 초기화 확인
3. 브라우저의 타이머 throttling 확인

### MIDI/HID가 작동하지 않음
1. 브라우저 지원 확인 (Chrome/Edge 권장)
2. HTTPS 환경 확인
3. 사용자 권한 승인 확인

---

## 📚 참고 자료

- Interactive Metronome Research (IM)
- Web MIDI API: https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API
- Web HID API: https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API
- Gamepad API: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API

---

## ✨ 향후 개선 사항

1. **데이터베이스 연동**: Firebase, Supabase 등
2. **사용자 계정**: 진행도 클라우드 저장
3. **고급 통계**: 추세 분석, 예측
4. **훈련 프로그램**: 70세션 프로그램 자동 구성
5. **모바일 지원**: 터치 입력
6. **음성 피드백**: TTS로 결과 읽어주기
7. **리더보드**: 다른 사용자와 비교
8. **커스텀 패턴**: 사용자 정의 훈련 패턴

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 콘솔 에러 메시지
2. 타입 에러
3. 브라우저 호환성

Happy Training! 🎯
