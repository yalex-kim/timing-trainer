/**
 * Assessment Report Generation Utilities
 * Generates comprehensive timing assessment reports
 */

import {
  TrainingSession,
  SessionResults,
  ComprehensiveAssessmentReport,
  ProcessingCapability,
  AttentionMetrics,
  SustainabilityMetrics,
  HemisphereBalance,
  LearningStyle,
  TimingClass,
  AgeGroup,
  AGE_BASED_STANDARDS,
} from '@/types/evaluation';
import { getAgeGroup } from './evaluator';

// ============================================================================
// Percentile Calculation (Normal Distribution Based)
// ============================================================================

/**
 * Calculate percentile based on Task Average using normal distribution
 * Assumes Class 4 (정상) is the median (50th percentile)
 */
export function calculatePercentile(
  taskAverage: number,
  age: number,
  mode: 'visual' | 'auditory'
): number {
  const evaluationMode = mode === 'visual' ? 'visual' : 'auditory';
  const ageGroup = getAgeGroup(age);
  const standards = AGE_BASED_STANDARDS[evaluationMode][ageGroup];

  // Find the class for this task average
  let classLevel: TimingClass = 1;
  for (const standard of standards) {
    if (taskAverage >= standard.range[0] && taskAverage < standard.range[1]) {
      classLevel = standard.class;
      break;
    }
  }

  // Map class to percentile using normal distribution
  // Class 7 (아주잘함) = 98th percentile
  // Class 6 (잘함) = 90th percentile
  // Class 5 (정상이상) = 75th percentile
  // Class 4 (정상) = 50th percentile
  // Class 3 (정상이하) = 25th percentile
  // Class 2 (결핍) = 10th percentile
  // Class 1 (극심한 결핍) = 2nd percentile

  const percentileMap: Record<TimingClass, number> = {
    7: 98,
    6: 90,
    5: 75,
    4: 50,
    3: 25,
    2: 10,
    1: 2,
  };

  return percentileMap[classLevel];
}

// ============================================================================
// Performance Level Determination
// ============================================================================

export function determinePerformanceLevel(classLevel: TimingClass): string {
  const levelMap: Record<TimingClass, string> = {
    7: "아주잘함",
    6: "잘함",
    5: "정상이상",
    4: "정상",
    3: "정상이하",
    2: "못함",
    1: "아주못함",
  };

  return levelMap[classLevel];
}

// ============================================================================
// Attention Metrics Calculation (Standard Deviation Based)
// ============================================================================

export function calculateAttentionMetrics(
  deviations: number[]
): AttentionMetrics {
  // Calculate standard deviation
  const mean = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const variance = deviations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / deviations.length;
  const standardDeviation = Math.sqrt(variance);

  // Convert standard deviation to percentile
  // Lower SD = better attention = higher percentile
  // SD < 20ms = 우수 (>70%)
  // SD 20-40ms = 보통 (30-70%)
  // SD > 40ms = 미달 (<30%)

  let percentile: number;
  let level: "미달" | "보통" | "우수";

  if (standardDeviation < 20) {
    percentile = 85;
    level = "우수";
  } else if (standardDeviation < 40) {
    // Linear interpolation between 30 and 70
    percentile = 70 - ((standardDeviation - 20) / 20) * 40;
    level = "보통";
  } else {
    // Linear mapping from 40ms to 100ms -> 30% to 5%
    percentile = Math.max(5, 30 - ((standardDeviation - 40) / 60) * 25);
    level = "미달";
  }

  return {
    percentile: Math.round(percentile),
    level,
    standardDeviation: Math.round(standardDeviation),
  };
}

// ============================================================================
// Sustainability Metrics Calculation
// ============================================================================

export function calculateSustainability(
  allDeviations: number[]
): SustainabilityMetrics {
  // Split into first half and second half
  const midpoint = Math.floor(allDeviations.length / 2);
  const earlyDeviations = allDeviations.slice(0, midpoint);
  const lateDeviations = allDeviations.slice(midpoint);

  const earlyAverage = earlyDeviations.reduce((a, b) => a + b, 0) / earlyDeviations.length;
  const lateAverage = lateDeviations.reduce((a, b) => a + b, 0) / lateDeviations.length;

  // Error rate: how much performance degrades (higher late average = more error)
  const errorRate = lateAverage > earlyAverage
    ? Math.min(100, ((lateAverage - earlyAverage) / earlyAverage) * 100)
    : 0;

  // Improvement rate: how much performance improves (lower late average = improvement)
  const improvementRate = earlyAverage > lateAverage
    ? Math.min(100, ((earlyAverage - lateAverage) / earlyAverage) * 100)
    : 0;

  return {
    errorRate: Math.round(errorRate),
    improvementRate: Math.round(improvementRate),
    earlyAverage: Math.round(earlyAverage),
    lateAverage: Math.round(lateAverage),
  };
}

// ============================================================================
// Hemisphere Balance Calculation
// ============================================================================

export function calculateHemisphereBalance(
  leftSideAverage: number,  // 왼손 + 왼발 평균
  rightSideAverage: number  // 오른손 + 오른발 평균
): HemisphereBalance {
  // 왼쪽 신체 = 우뇌, 오른쪽 신체 = 좌뇌
  // Lower task average = better performance = higher percentage

  const total = leftSideAverage + rightSideAverage;

  // Invert the ratio (lower TA = higher brain performance)
  // If left side is better (lower TA), right brain gets higher percentage
  const rightBrain = Math.round((rightSideAverage / total) * 100);
  const leftBrain = 100 - rightBrain;

  const difference = Math.abs(leftBrain - rightBrain);

  let correlation: "높음" | "보통" | "낮음";
  if (difference < 10) {
    correlation = "높음";
  } else if (difference < 20) {
    correlation = "보통";
  } else {
    correlation = "낮음";
  }

  return {
    leftBrain,
    rightBrain,
    correlation,
    difference,
  };
}

// ============================================================================
// Learning Style Determination
// ============================================================================

export function determineLearningStyle(
  visualPercentile: number,
  auditoryPercentile: number
): LearningStyle {
  const difference = Math.abs(visualPercentile - auditoryPercentile);

  if (difference < 5) {
    return {
      dominantStyle: "balanced",
      difference,
      dominantLabel: "균형적",
    };
  } else if (visualPercentile > auditoryPercentile) {
    return {
      dominantStyle: "visual",
      difference,
      dominantLabel: "시각우성",
    };
  } else {
    return {
      dominantStyle: "auditory",
      difference,
      dominantLabel: "청각우성",
    };
  }
}

// ============================================================================
// Brain Speed Calculation
// ============================================================================

export function calculateBrainSpeed(
  visualTaskAverage: number,
  auditoryTaskAverage: number
): { taskAverage: number; level: "미달" | "보통" | "우수"; percentile: number } {
  const taskAverage = Math.round((visualTaskAverage + auditoryTaskAverage) / 2);

  // Determine level based on task average
  let level: "미달" | "보통" | "우수";
  let percentile: number;

  if (taskAverage < 50) {
    level = "우수";
    percentile = 85;
  } else if (taskAverage < 100) {
    level = "보통";
    percentile = 50;
  } else {
    level = "미달";
    percentile = 15;
  }

  return {
    taskAverage,
    level,
    percentile,
  };
}

// ============================================================================
// Processing Capability Calculation
// ============================================================================

export function calculateProcessingCapability(
  taskAverage: number,
  classLevel: TimingClass,
  age: number,
  mode: 'visual' | 'auditory'
): ProcessingCapability {
  const percentile = calculatePercentile(taskAverage, age, mode);
  const level = determinePerformanceLevel(classLevel);

  return {
    taskAverage: Math.round(taskAverage),
    percentile,
    level,
    classLevel,
  };
}

// ============================================================================
// Comprehensive Report Generation
// ============================================================================

export function generateComprehensiveReport(
  sessions: TrainingSession[]
): ComprehensiveAssessmentReport {
  // Validate we have 8 sessions
  if (sessions.length !== 8) {
    throw new Error('Comprehensive report requires exactly 8 assessment sessions');
  }

  const userProfile = sessions[0].userProfile;
  const age = userProfile.age!;

  // Organize sessions by type
  const visualSessions = sessions.filter(s => s.settings.trainingType === 'visual');
  const auditorySessions = sessions.filter(s => s.settings.trainingType === 'audio');

  const leftSideSessions = sessions.filter(s =>
    s.settings.trainingRange === 'left'
  );
  const rightSideSessions = sessions.filter(s =>
    s.settings.trainingRange === 'right'
  );

  // Calculate averages for each category
  const visualTaskAverage = visualSessions.reduce((sum, s) =>
    sum + (s.results?.taskAverage || 0), 0
  ) / visualSessions.length;

  const auditoryTaskAverage = auditorySessions.reduce((sum, s) =>
    sum + (s.results?.taskAverage || 0), 0
  ) / auditorySessions.length;

  const leftSideTaskAverage = leftSideSessions.reduce((sum, s) =>
    sum + (s.results?.taskAverage || 0), 0
  ) / leftSideSessions.length;

  const rightSideTaskAverage = rightSideSessions.reduce((sum, s) =>
    sum + (s.results?.taskAverage || 0), 0
  ) / rightSideSessions.length;

  // Get all deviations for attention calculation
  const visualDeviations: number[] = [];
  const auditoryDeviations: number[] = [];

  sessions.forEach(s => {
    const deviations = s.beats
      .filter(b => b.deviation !== null && b.isCorrectInput)
      .map(b => Math.abs(b.deviation!));

    if (s.settings.trainingType === 'visual') {
      visualDeviations.push(...deviations);
    } else {
      auditoryDeviations.push(...deviations);
    }
  });

  // Determine class levels (use first session of each type)
  const visualClass = visualSessions[0].results?.classLevel || 1;
  const auditoryClass = auditorySessions[0].results?.classLevel || 1;

  // Calculate all metrics
  const visualCapability = calculateProcessingCapability(
    visualTaskAverage,
    visualClass,
    age,
    'visual'
  );

  const auditoryCapability = calculateProcessingCapability(
    auditoryTaskAverage,
    auditoryClass,
    'auditory'
  );

  const learningStyle = determineLearningStyle(
    visualCapability.percentile,
    auditoryCapability.percentile
  );

  const visualAttention = calculateAttentionMetrics(visualDeviations);
  const auditoryAttention = calculateAttentionMetrics(auditoryDeviations);

  const brainSpeed = calculateBrainSpeed(visualTaskAverage, auditoryTaskAverage);

  const visualSustainability = calculateSustainability(visualDeviations);
  const auditorySustainability = calculateSustainability(auditoryDeviations);

  const hemisphereBalance = calculateHemisphereBalance(
    leftSideTaskAverage,
    rightSideTaskAverage
  );

  // Build individual results
  const testNames = [
    '왼손 청각', '왼손 시각', '오른손 청각', '오른손 시각',
    '왼발 청각', '왼발 시각', '오른발 청각', '오른발 시각'
  ];

  const individualResults = sessions.map((session, index) => ({
    testName: testNames[index],
    sessionResults: session.results!,
  }));

  return {
    patientInfo: {
      name: userProfile.name,
      gender: userProfile.gender,
      age,
      testDate: new Date(sessions[0].date).toISOString().split('T')[0],
    },
    processingCapability: {
      visual: visualCapability,
      auditory: auditoryCapability,
    },
    learningStyle,
    attention: {
      visual: visualAttention,
      auditory: auditoryAttention,
    },
    brainSpeed,
    sustainability: {
      visual: visualSustainability,
      auditory: auditorySustainability,
    },
    hemisphereBalance,
    individualResults,
    sessions,
  };
}
