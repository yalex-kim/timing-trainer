/**
 * Timing Evaluation System
 * Based on Interactive Metronome (IM) Research
 */

// ============================================================================
// 사용자 프로필
// ============================================================================

export interface UserProfile {
  name: string;
  birthDate: string;        // YYYY-MM-DD
  gender: 'male' | 'female' | 'other';
  age?: number;             // 계산된 나이 (자동)
}

// ============================================================================
// 입력 시스템 (4가지 독립 입력)
// ============================================================================

export type InputType = 'left-hand' | 'right-hand' | 'left-foot' | 'right-foot';

export interface InputEvent {
  type: InputType;
  timestamp: number;        // performance.now() 기준
  source: 'keyboard' | 'usb' | 'midi' | 'gamepad' | 'touch';
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

export type AgeGroup = 'under7' | '8-9' | '10-11' | '12-13' | '14-16' | 'over17';

export interface ClassLevel {
  class: TimingClass;
  label: string;
  description: string;
  taRange: [number, number]; // [min, max] in ms
  color: string;
}

// 연령대별, 모드별 Class 기준 (QTrainer 표준 규준표)
export interface AgeBasedClassRange {
  class: TimingClass;
  range: [number, number]; // [min, max] TA in ms
}

export const AGE_BASED_STANDARDS: {
  auditory: Record<AgeGroup, AgeBasedClassRange[]>;
  visual: Record<AgeGroup, AgeBasedClassRange[]>;
} = {
  // 청각 모드 기준
  auditory: {
    'under7': [
      { class: 7, range: [0, 40] },      // 아주잘함
      { class: 6, range: [40, 60] },     // 잘함
      { class: 5, range: [60, 80] },     // 정상이상
      { class: 4, range: [80, 100] },    // 정상
      { class: 3, range: [100, 150] },   // 정상이하
      { class: 2, range: [150, 230] },   // 못함
      { class: 1, range: [230, Infinity] }, // 아주못함
    ],
    '8-9': [
      { class: 7, range: [0, 30] },
      { class: 6, range: [30, 35] },
      { class: 5, range: [35, 45] },
      { class: 4, range: [45, 70] },
      { class: 3, range: [70, 155] },
      { class: 2, range: [155, 200] },
      { class: 1, range: [200, Infinity] },
    ],
    '10-11': [
      { class: 7, range: [0, 27] },
      { class: 6, range: [27, 34] },
      { class: 5, range: [34, 40] },
      { class: 4, range: [40, 60] },
      { class: 3, range: [60, 130] },
      { class: 2, range: [130, 160] },
      { class: 1, range: [160, Infinity] },
    ],
    '12-13': [
      { class: 7, range: [0, 25] },
      { class: 6, range: [25, 30] },
      { class: 5, range: [30, 35] },
      { class: 4, range: [35, 45] },
      { class: 3, range: [45, 105] },
      { class: 2, range: [105, 150] },
      { class: 1, range: [150, Infinity] },
    ],
    '14-16': [
      { class: 7, range: [0, 20] },
      { class: 6, range: [20, 25] },
      { class: 5, range: [25, 30] },
      { class: 4, range: [30, 45] },
      { class: 3, range: [45, 90] },
      { class: 2, range: [90, 120] },
      { class: 1, range: [120, Infinity] },
    ],
    'over17': [
      { class: 7, range: [0, 17] },
      { class: 6, range: [17, 25] },
      { class: 5, range: [25, 30] },
      { class: 4, range: [30, 40] },
      { class: 3, range: [40, 75] },
      { class: 2, range: [75, 90] },
      { class: 1, range: [90, Infinity] },
    ],
  },
  // 시각 모드 기준
  visual: {
    'under7': [
      { class: 7, range: [0, 50] },
      { class: 6, range: [50, 80] },
      { class: 5, range: [80, 100] },
      { class: 4, range: [100, 120] },
      { class: 3, range: [120, 170] },
      { class: 2, range: [170, 250] },
      { class: 1, range: [250, Infinity] },
    ],
    '8-9': [
      { class: 7, range: [0, 40] },
      { class: 6, range: [40, 55] },
      { class: 5, range: [55, 65] },
      { class: 4, range: [65, 90] },
      { class: 3, range: [90, 130] },
      { class: 2, range: [130, 220] },
      { class: 1, range: [220, Infinity] },
    ],
    '10-11': [
      { class: 7, range: [0, 35] },
      { class: 6, range: [35, 45] },
      { class: 5, range: [45, 60] },
      { class: 4, range: [60, 75] },
      { class: 3, range: [75, 110] },
      { class: 2, range: [110, 200] },
      { class: 1, range: [200, Infinity] },
    ],
    '12-13': [
      { class: 7, range: [0, 30] },
      { class: 6, range: [30, 40] },
      { class: 5, range: [40, 50] },
      { class: 4, range: [50, 65] },
      { class: 3, range: [65, 95] },
      { class: 2, range: [95, 160] },
      { class: 1, range: [160, Infinity] },
    ],
    '14-16': [
      { class: 7, range: [0, 27] },
      { class: 6, range: [27, 30] },
      { class: 5, range: [30, 40] },
      { class: 4, range: [40, 55] },
      { class: 3, range: [55, 75] },
      { class: 2, range: [75, 130] },
      { class: 1, range: [130, Infinity] },
    ],
    'over17': [
      { class: 7, range: [0, 25] },
      { class: 6, range: [25, 30] },
      { class: 5, range: [30, 40] },
      { class: 4, range: [40, 50] },
      { class: 3, range: [50, 70] },
      { class: 2, range: [70, 100] },
      { class: 1, range: [100, Infinity] },
    ],
  },
};

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

  // 사용자 정보
  userProfile: UserProfile;

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
