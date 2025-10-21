/**
 * Timing Evaluation System
 * Based on Interactive Metronome (IM) Research
 */

// ============================================================================
// 입력 시스템 (4가지 독립 입력)
// ============================================================================

export type InputType = 'left-hand' | 'right-hand' | 'left-foot' | 'right-foot';

export interface InputEvent {
  type: InputType;
  timestamp: number;        // performance.now() 기준
  source: 'keyboard' | 'usb' | 'midi' | 'gamepad';
  rawData?: any;            // 원본 디바이스 데이터
}

// 키보드 매핑 (임시, 추후 USB 디바이스로 대체 가능)
export const DEFAULT_KEY_MAPPING = {
  'a': 'left-hand' as InputType,   // A 키 = 왼손
  'd': 'right-hand' as InputType,  // D 키 = 오른손
  'z': 'left-foot' as InputType,   // Z 키 = 왼발
  'c': 'right-foot' as InputType,  // C 키 = 오른발
};

// ============================================================================
// 훈련 모드별 예상 입력 패턴
// ============================================================================

export type TrainingPattern =
  | 'left-hand-only'
  | 'right-hand-only'
  | 'both-hands-alternate'
  | 'both-hands-simultaneous'
  | 'left-foot-only'
  | 'right-foot-only'
  | 'both-feet-alternate'
  | 'both-feet-simultaneous'
  | 'left-hand-right-foot'
  | 'right-hand-left-foot'
  | 'all-alternate';

export interface ExpectedInput {
  beatNumber: number;
  expectedTypes: InputType[];  // 허용되는 입력 타입들
  isAlternating: boolean;      // 교대 패턴인지
  alternateIndex?: number;     // 교대 패턴의 현재 순서
}

// ============================================================================
// IM 기반 평가 지표
// ============================================================================

export type TimingClass = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ClassLevel {
  class: TimingClass;
  label: string;
  description: string;
  taRange: [number, number]; // [min, max] in ms
  color: string;
}

export const CLASS_DEFINITIONS: ClassLevel[] = [
  {
    class: 7,
    label: "최상급",
    description: "최상급 타이밍 능력",
    taRange: [0, 20],
    color: '#8b5cf6' // 보라색
  },
  {
    class: 6,
    label: "뛰어남",
    description: "뛰어난 타이밍 능력",
    taRange: [20, 40],
    color: '#6366f1' // 인디고
  },
  {
    class: 5,
    label: "평균 이상",
    description: "평균보다 높은 타이밍 능력",
    taRange: [40, 80],
    color: '#10b981' // 초록색
  },
  {
    class: 4,
    label: "평균",
    description: "평균적인 타이밍 능력",
    taRange: [80, 120],
    color: '#3b82f6' // 파란색
  },
  {
    class: 3,
    label: "평균 이하",
    description: "평균보다 낮은 타이밍 능력",
    taRange: [120, 180],
    color: '#f59e0b' // 주황색
  },
  {
    class: 2,
    label: "심각한 결핍",
    description: "심각한 타이밍 결핍",
    taRange: [180, 250],
    color: '#f97316' // 진한 주황색
  },
  {
    class: 1,
    label: "극심한 결핍",
    description: "가장 심각한 타이밍 결핍",
    taRange: [250, Infinity],
    color: '#ef4444' // 빨간색
  }
];

// ============================================================================
// 실시간 피드백 등급
// ============================================================================

export type FeedbackCategory = 'perfect' | 'excellent' | 'good' | 'fair' | 'poor' | 'miss';

export interface FeedbackThreshold {
  range: number;      // ms
  points: number;     // 0-100
  color: string;
  message: string;
}

export const FEEDBACK_THRESHOLDS: Record<FeedbackCategory, FeedbackThreshold> = {
  perfect: {
    range: 15,
    points: 100,
    color: '#10b981',
    message: 'PERFECT!'
  },
  excellent: {
    range: 30,
    points: 90,
    color: '#22c55e',
    message: 'EXCELLENT'
  },
  good: {
    range: 50,
    points: 75,
    color: '#84cc16',
    message: 'GOOD'
  },
  fair: {
    range: 80,
    points: 60,
    color: '#eab308',
    message: 'FAIR'
  },
  poor: {
    range: 120,
    points: 40,
    color: '#f97316',
    message: 'POOR'
  },
  miss: {
    range: Infinity,
    points: 0,
    color: '#ef4444',
    message: 'MISS'
  }
};

// ============================================================================
// 비트 데이터
// ============================================================================

export interface BeatData {
  beatNumber: number;
  expectedTime: number;           // ms (세션 시작 기준)
  expectedInput: ExpectedInput;   // 예상되는 입력

  // 실제 입력 (없으면 null)
  actualInput: InputEvent | null;
  actualTime: number | null;      // ms

  // 평가 결과
  deviation: number | null;       // ms (음수 = 빠름, 양수 = 느림)
  isCorrectInput: boolean;        // 올바른 입력인지
  isWrongInput: boolean;          // 잘못된 입력인지
  feedback: TimingFeedback | null;
}

export interface TimingFeedback {
  category: FeedbackCategory;
  deviation: number;              // ms
  direction: 'early' | 'late' | 'on-time';
  points: number;                 // 0-100
  color: string;
  message: string;
  displayText: string;            // "+15ms" 등
}

// ============================================================================
// 세션 결과
// ============================================================================

export interface SessionResults {
  // IM 핵심 지표
  taskAverage: number;            // TA (ms) - 주요 지표
  classLevel: TimingClass;        // 1-7
  earlyHitPercent: number;        // % (조기 반응)
  lateHitPercent: number;         // % (지연 반응)
  onTargetPercent: number;        // % (정확한 타이밍)

  // 기본 통계
  totalBeats: number;
  responsiveBeats: number;        // 입력이 있었던 비트
  missedBeats: number;            // 입력이 없었던 비트
  wrongInputBeats: number;        // 잘못된 입력
  responseRate: number;           // %
  accuracyRate: number;           // % (올바른 입력 비율)

  // 피드백 분포
  perfectCount: number;
  excellentCount: number;
  goodCount: number;
  fairCount: number;
  poorCount: number;
  missCount: number;

  // 종합 점수
  averagePoints: number;          // 0-100
  consistency: number;            // 0-100 (일관성, 표준편차 기반)

  // 신체 부위별 통계
  inputTypeStats: {
    [key in InputType]?: {
      count: number;
      averageDeviation: number;
      averagePoints: number;
    }
  };

  // 개선도 (이전 세션 대비)
  taImprovement?: number;         // %
  classImprovement?: number;      // 레벨 변화
}

// ============================================================================
// 훈련 세션
// ============================================================================

export interface TrainingSession {
  // 기본 정보
  sessionId: string;
  sessionNumber: number;
  date: string;
  startTime: number;              // timestamp
  endTime?: number;               // timestamp

  // 설정
  settings: {
    trainingType: 'visual' | 'audio';
    bodyPart: 'hand' | 'foot';
    trainingRange: 'left' | 'right' | 'both';
    bpm: number;
    durationMinutes: number;
    pattern: TrainingPattern;     // 실제 훈련 패턴
  };

  // 데이터
  beats: BeatData[];

  // 결과
  results?: SessionResults;
}

// ============================================================================
// 진행도 추적
// ============================================================================

export interface ProgressTracking {
  userId?: string;
  totalSessions: number;
  sessionHistory: TrainingSession[];

  // 장기 추세
  trends: {
    dates: string[];
    taHistory: number[];
    classHistory: TimingClass[];
    averagePointsHistory: number[];
  };

  // 목표
  goals: {
    targetTA: number;
    targetClass: TimingClass;
    sessionsToGoal: number;
  };

  // 전체 통계
  overallStats: {
    bestTA: number;
    bestClass: TimingClass;
    averageTA: number;
    totalBeatsCompleted: number;
    totalPerfectHits: number;
    improvementRate: number;      // % per session
  };
}

// ============================================================================
// 입력 매핑 설정 (추후 사용자 커스터마이징 가능)
// ============================================================================

export interface InputMapping {
  leftHand: {
    keyboard?: string[];          // ['a', 'q']
    usb?: number[];               // USB 버튼 ID
    midi?: number[];              // MIDI 노트 번호
    gamepad?: number[];           // 게임패드 버튼 번호
  };
  rightHand: {
    keyboard?: string[];
    usb?: number[];
    midi?: number[];
    gamepad?: number[];
  };
  leftFoot: {
    keyboard?: string[];
    usb?: number[];
    midi?: number[];
    gamepad?: number[];
  };
  rightFoot: {
    keyboard?: string[];
    usb?: number[];
    midi?: number[];
    gamepad?: number[];
  };
}

export const DEFAULT_INPUT_MAPPING: InputMapping = {
  leftHand: {
    keyboard: ['a', 'A', 'q', 'Q'],
  },
  rightHand: {
    keyboard: ['d', 'D', 'e', 'E'],
  },
  leftFoot: {
    keyboard: ['z', 'Z', 'x', 'X'],
  },
  rightFoot: {
    keyboard: ['c', 'C', 'v', 'V'],
  },
};
