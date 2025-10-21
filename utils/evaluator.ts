/**
 * Timing Evaluation Logic
 * Based on Interactive Metronome (IM) Research
 */

import {
  InputType,
  InputEvent,
  TrainingPattern,
  ExpectedInput,
  BeatData,
  TimingFeedback,
  FeedbackCategory,
  SessionResults,
  TimingClass,
  CLASS_DEFINITIONS,
  FEEDBACK_THRESHOLDS,
} from '@/types/evaluation';

// ============================================================================
// 훈련 패턴별 예상 입력 생성
// ============================================================================

export class PatternGenerator {
  /**
   * 훈련 패턴에 따른 예상 입력 생성
   */
  static generateExpectedInput(
    pattern: TrainingPattern,
    beatNumber: number
  ): ExpectedInput {
    switch (pattern) {
      case 'left-hand-only':
        return {
          beatNumber,
          expectedTypes: ['left-hand'],
          isAlternating: false,
        };

      case 'right-hand-only':
        return {
          beatNumber,
          expectedTypes: ['right-hand'],
          isAlternating: false,
        };

      case 'both-hands-alternate':
        return {
          beatNumber,
          expectedTypes: beatNumber % 2 === 0 ? ['left-hand'] : ['right-hand'],
          isAlternating: true,
          alternateIndex: beatNumber % 2,
        };

      case 'both-hands-simultaneous':
        return {
          beatNumber,
          expectedTypes: ['left-hand', 'right-hand'],
          isAlternating: false,
        };

      case 'left-foot-only':
        return {
          beatNumber,
          expectedTypes: ['left-foot'],
          isAlternating: false,
        };

      case 'right-foot-only':
        return {
          beatNumber,
          expectedTypes: ['right-foot'],
          isAlternating: false,
        };

      case 'both-feet-alternate':
        return {
          beatNumber,
          expectedTypes: beatNumber % 2 === 0 ? ['left-foot'] : ['right-foot'],
          isAlternating: true,
          alternateIndex: beatNumber % 2,
        };

      case 'both-feet-simultaneous':
        return {
          beatNumber,
          expectedTypes: ['left-foot', 'right-foot'],
          isAlternating: false,
        };

      case 'left-hand-right-foot':
        return {
          beatNumber,
          expectedTypes: beatNumber % 2 === 0 ? ['left-hand'] : ['right-foot'],
          isAlternating: true,
          alternateIndex: beatNumber % 2,
        };

      case 'right-hand-left-foot':
        return {
          beatNumber,
          expectedTypes: beatNumber % 2 === 0 ? ['right-hand'] : ['left-foot'],
          isAlternating: true,
          alternateIndex: beatNumber % 2,
        };

      case 'all-alternate':
        const sequence: InputType[] = ['left-hand', 'right-hand', 'left-foot', 'right-foot'];
        return {
          beatNumber,
          expectedTypes: [sequence[beatNumber % 4]],
          isAlternating: true,
          alternateIndex: beatNumber % 4,
        };

      default:
        return {
          beatNumber,
          expectedTypes: ['left-hand'],
          isAlternating: false,
        };
    }
  }

  /**
   * 기존 설정을 훈련 패턴으로 변환
   */
  static settingsToPattern(
    bodyPart: 'hand' | 'foot',
    trainingRange: 'left' | 'right' | 'both'
  ): TrainingPattern {
    if (bodyPart === 'hand') {
      if (trainingRange === 'left') return 'left-hand-only';
      if (trainingRange === 'right') return 'right-hand-only';
      return 'both-hands-alternate';
    } else {
      if (trainingRange === 'left') return 'left-foot-only';
      if (trainingRange === 'right') return 'right-foot-only';
      return 'both-feet-alternate';
    }
  }
}

// ============================================================================
// 타이밍 평가기
// ============================================================================

export class TimingEvaluator {
  /**
   * 입력이 예상된 입력 타입과 일치하는지 확인
   */
  static isCorrectInput(
    inputType: InputType,
    expected: ExpectedInput
  ): boolean {
    return expected.expectedTypes.includes(inputType);
  }

  /**
   * 단일 비트 평가 (타이밍 + 입력 검증)
   */
  static evaluateBeat(
    expectedTime: number,
    actualTime: number,
    inputType: InputType,
    expected: ExpectedInput
  ): {
    feedback: TimingFeedback;
    isCorrectInput: boolean;
  } {
    const deviation = actualTime - expectedTime;
    const absDeviation = Math.abs(deviation);
    const isCorrectInput = this.isCorrectInput(inputType, expected);

    // 피드백 카테고리 결정
    let category: FeedbackCategory;
    let threshold: typeof FEEDBACK_THRESHOLDS[FeedbackCategory];

    if (absDeviation <= FEEDBACK_THRESHOLDS.perfect.range) {
      category = 'perfect';
    } else if (absDeviation <= FEEDBACK_THRESHOLDS.excellent.range) {
      category = 'excellent';
    } else if (absDeviation <= FEEDBACK_THRESHOLDS.good.range) {
      category = 'good';
    } else if (absDeviation <= FEEDBACK_THRESHOLDS.fair.range) {
      category = 'fair';
    } else if (absDeviation <= FEEDBACK_THRESHOLDS.poor.range) {
      category = 'poor';
    } else {
      category = 'miss';
    }

    threshold = FEEDBACK_THRESHOLDS[category];

    // 방향 결정
    const direction = absDeviation <= 5 ? 'on-time' : deviation < 0 ? 'early' : 'late';

    // 잘못된 입력이면 페널티
    const finalPoints = isCorrectInput ? threshold.points : threshold.points * 0.5;

    const feedback: TimingFeedback = {
      category,
      deviation,
      direction,
      points: finalPoints,
      color: threshold.color,
      message: isCorrectInput ? threshold.message : `WRONG INPUT - ${threshold.message}`,
      displayText: `${deviation > 0 ? '+' : ''}${deviation.toFixed(0)}ms`,
    };

    return {
      feedback,
      isCorrectInput,
    };
  }

  /**
   * Class 레벨 결정 (TA 기반)
   */
  static determineClass(ta: number): TimingClass {
    for (const def of CLASS_DEFINITIONS) {
      if (ta >= def.taRange[0] && ta < def.taRange[1]) {
        return def.class;
      }
    }
    return 1; // 기본값 (최하위)
  }

  /**
   * 일관성 점수 계산 (표준편차 기반, 0-100)
   */
  static calculateConsistency(deviations: number[]): number {
    if (deviations.length < 2) return 100;

    const mean = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const variance =
      deviations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
      deviations.length;
    const stdDev = Math.sqrt(variance);

    // 표준편차를 0-100 점수로 변환
    // stdDev 0 = 100점, stdDev 100+ = 0점
    return Math.max(0, Math.min(100, 100 - stdDev));
  }

  /**
   * 세션 전체 평가
   */
  static evaluateSession(beats: BeatData[]): SessionResults {
    const validBeats = beats.filter((b) => b.actualTime !== null);
    const correctInputBeats = validBeats.filter((b) => b.isCorrectInput);
    const wrongInputBeats = validBeats.filter((b) => b.isWrongInput);

    // Task Average (TA) 계산 - 올바른 입력만 사용
    const deviations = correctInputBeats.map((b) => Math.abs(b.deviation!));
    const taskAverage =
      deviations.length > 0
        ? deviations.reduce((a, b) => a + b, 0) / deviations.length
        : 999;

    // Class 결정
    const classLevel = this.determineClass(taskAverage);

    // Early/Late/OnTarget 분포
    const earlyCount = correctInputBeats.filter((b) => b.deviation! < -5).length;
    const lateCount = correctInputBeats.filter((b) => b.deviation! > 5).length;
    const onTargetCount = correctInputBeats.filter(
      (b) => Math.abs(b.deviation!) <= 5
    ).length;

    const totalResponses = correctInputBeats.length;

    // 피드백 카테고리별 집계
    const feedbackCounts = {
      perfect: validBeats.filter((b) => b.feedback?.category === 'perfect').length,
      excellent: validBeats.filter((b) => b.feedback?.category === 'excellent').length,
      good: validBeats.filter((b) => b.feedback?.category === 'good').length,
      fair: validBeats.filter((b) => b.feedback?.category === 'fair').length,
      poor: validBeats.filter((b) => b.feedback?.category === 'poor').length,
      miss: validBeats.filter((b) => b.feedback?.category === 'miss').length,
    };

    // 평균 점수
    const averagePoints =
      totalResponses > 0
        ? validBeats.reduce((sum, b) => sum + (b.feedback?.points || 0), 0) /
          totalResponses
        : 0;

    // 일관성
    const consistency = this.calculateConsistency(deviations);

    // 신체 부위별 통계
    const inputTypeStats: SessionResults['inputTypeStats'] = {};
    const inputTypes: InputType[] = ['left-hand', 'right-hand', 'left-foot', 'right-foot'];

    inputTypes.forEach((type) => {
      const typeBeats = validBeats.filter((b) => b.actualInput?.type === type);
      if (typeBeats.length > 0) {
        const typeDeviations = typeBeats
          .filter((b) => b.deviation !== null)
          .map((b) => Math.abs(b.deviation!));
        const typePoints = typeBeats.map((b) => b.feedback?.points || 0);

        inputTypeStats[type] = {
          count: typeBeats.length,
          averageDeviation:
            typeDeviations.length > 0
              ? typeDeviations.reduce((a, b) => a + b, 0) / typeDeviations.length
              : 0,
          averagePoints:
            typePoints.length > 0
              ? typePoints.reduce((a, b) => a + b, 0) / typePoints.length
              : 0,
        };
      }
    });

    return {
      taskAverage,
      classLevel,
      earlyHitPercent: totalResponses > 0 ? (earlyCount / totalResponses) * 100 : 0,
      lateHitPercent: totalResponses > 0 ? (lateCount / totalResponses) * 100 : 0,
      onTargetPercent: totalResponses > 0 ? (onTargetCount / totalResponses) * 100 : 0,
      totalBeats: beats.length,
      responsiveBeats: validBeats.length,
      missedBeats: beats.length - validBeats.length,
      wrongInputBeats: wrongInputBeats.length,
      responseRate: (validBeats.length / beats.length) * 100,
      accuracyRate: (correctInputBeats.length / validBeats.length) * 100 || 0,
      perfectCount: feedbackCounts.perfect,
      excellentCount: feedbackCounts.excellent,
      goodCount: feedbackCounts.good,
      fairCount: feedbackCounts.fair,
      poorCount: feedbackCounts.poor,
      missCount: feedbackCounts.miss,
      averagePoints,
      consistency,
      inputTypeStats,
    };
  }

  /**
   * 개선도 계산 (이전 세션 대비)
   */
  static calculateImprovement(
    currentResults: SessionResults,
    previousResults: SessionResults
  ): {
    taImprovement: number;
    classImprovement: number;
  } {
    const taImprovement =
      previousResults.taskAverage > 0
        ? ((previousResults.taskAverage - currentResults.taskAverage) /
            previousResults.taskAverage) *
          100
        : 0;

    const classImprovement = currentResults.classLevel - previousResults.classLevel;

    return {
      taImprovement,
      classImprovement,
    };
  }
}

// ============================================================================
// 입력 매핑 유틸리티
// ============================================================================

export class InputMapper {
  /**
   * 키보드 키를 InputType으로 변환
   */
  static keyToInputType(key: string): InputType | null {
    const keyLower = key.toLowerCase();

    // 왼손
    if (['a', 'q'].includes(keyLower)) return 'left-hand';
    // 오른손
    if (['d', 'e'].includes(keyLower)) return 'right-hand';
    // 왼발
    if (['z', 'x'].includes(keyLower)) return 'left-foot';
    // 오른발
    if (['c', 'v'].includes(keyLower)) return 'right-foot';

    return null;
  }

  /**
   * MIDI 노트를 InputType으로 변환 (예시)
   */
  static midiNoteToInputType(note: number): InputType | null {
    // MIDI 노트 번호에 따라 매핑 (커스터마이징 가능)
    if (note === 60) return 'left-hand';  // C4
    if (note === 62) return 'right-hand'; // D4
    if (note === 64) return 'left-foot';  // E4
    if (note === 65) return 'right-foot'; // F4
    return null;
  }

  /**
   * USB HID 버튼을 InputType으로 변환 (예시)
   */
  static hidButtonToInputType(buttonId: number): InputType | null {
    // 버튼 ID에 따라 매핑 (실제 디바이스에 맞게 조정)
    if (buttonId === 0) return 'left-hand';
    if (buttonId === 1) return 'right-hand';
    if (buttonId === 2) return 'left-foot';
    if (buttonId === 3) return 'right-foot';
    return null;
  }

  /**
   * Gamepad 버튼을 InputType으로 변환 (예시)
   */
  static gamepadButtonToInputType(buttonIndex: number): InputType | null {
    // 게임패드 버튼에 따라 매핑
    if (buttonIndex === 0) return 'left-hand';  // A 버튼
    if (buttonIndex === 1) return 'right-hand'; // B 버튼
    if (buttonIndex === 2) return 'left-foot';  // X 버튼
    if (buttonIndex === 3) return 'right-foot'; // Y 버튼
    return null;
  }
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * Class 정보 가져오기
 */
export function getClassInfo(classLevel: TimingClass) {
  return CLASS_DEFINITIONS.find((def) => def.class === classLevel);
}

/**
 * 피드백 메시지 포맷팅
 */
export function formatFeedback(feedback: TimingFeedback): string {
  return `${feedback.message} (${feedback.displayText})`;
}

/**
 * TA를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatTA(ta: number): string {
  return `${ta.toFixed(1)}ms`;
}

/**
 * Early/Late 균형 평가
 */
export function evaluateBalance(earlyPercent: number, latePercent: number): string {
  const diff = Math.abs(earlyPercent - latePercent);
  if (diff <= 10) return '균형잡힘 (Balanced)';
  return earlyPercent > latePercent
    ? '조기 편향 (Early-Biased)'
    : '지연 편향 (Late-Biased)';
}
