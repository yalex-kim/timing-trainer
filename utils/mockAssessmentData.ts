import {
  TrainingSession,
  SessionResults,
  BeatData,
  TimingClass,
  InputType,
  TrainingPattern,
  UserProfile,
} from '@/types/evaluation';

/**
 * 테스트용 더미 검사 데이터 생성 함수
 */
export function generateMockAssessmentData(): TrainingSession[] {
  // 더미 사용자 프로필
  const mockUserProfile: UserProfile = {
    name: '홍길동',
    birthDate: '2010-03-15',
    gender: 'male',
    age: 14,
  };

  // 8가지 검사 정의
  const assessmentTests = [
    { name: '왼손 청각', bodyPart: 'hand' as const, trainingRange: 'left' as const, trainingType: 'audio' as const },
    { name: '왼손 시각', bodyPart: 'hand' as const, trainingRange: 'left' as const, trainingType: 'visual' as const },
    { name: '오른손 청각', bodyPart: 'hand' as const, trainingRange: 'right' as const, trainingType: 'audio' as const },
    { name: '오른손 시각', bodyPart: 'hand' as const, trainingRange: 'right' as const, trainingType: 'visual' as const },
    { name: '왼발 청각', bodyPart: 'foot' as const, trainingRange: 'left' as const, trainingType: 'audio' as const },
    { name: '왼발 시각', bodyPart: 'foot' as const, trainingRange: 'left' as const, trainingType: 'visual' as const },
    { name: '오른발 청각', bodyPart: 'foot' as const, trainingRange: 'right' as const, trainingType: 'audio' as const },
    { name: '오른발 시각', bodyPart: 'foot' as const, trainingRange: 'right' as const, trainingType: 'visual' as const },
  ];

  const sessions: TrainingSession[] = [];
  const bpm = 60;
  const durationSeconds = 40;
  const intervalMs = 60000 / bpm;
  const totalBeats = Math.floor((durationSeconds * 1000) / intervalMs);

  assessmentTests.forEach((test, testIndex) => {
    // 각 테스트마다 약간 다른 성능을 시뮬레이션
    const baseTaskAverage = 30 + Math.random() * 30; // 30-60ms
    const baseAccuracy = 85 + Math.random() * 10; // 85-95%

    const beats: BeatData[] = [];
    const deviations: number[] = [];

    for (let i = 0; i < totalBeats; i++) {
      const expectedTime = i * intervalMs;
      const expectedInputType: InputType =
        test.bodyPart === 'hand'
          ? test.trainingRange === 'left' ? 'left-hand' : 'right-hand'
          : test.trainingRange === 'left' ? 'left-foot' : 'right-foot';

      // 랜덤하게 입력 여부 결정 (90% 입력)
      const hasInput = Math.random() < (baseAccuracy / 100);

      if (hasInput) {
        // 정규분포를 따르는 deviation 생성
        const deviation = (Math.random() - 0.5) * 2 * baseTaskAverage * 1.5;
        deviations.push(Math.abs(deviation));

        const actualTime = expectedTime + deviation;

        // Feedback 결정
        const absDev = Math.abs(deviation);
        let category: 'perfect' | 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
        let points = 60;
        let color = '#eab308';

        if (absDev < 15) {
          category = 'perfect';
          points = 100;
          color = '#10b981';
        } else if (absDev < 30) {
          category = 'excellent';
          points = 90;
          color = '#22c55e';
        } else if (absDev < 50) {
          category = 'good';
          points = 75;
          color = '#84cc16';
        } else if (absDev < 80) {
          category = 'fair';
          points = 60;
          color = '#eab308';
        } else {
          category = 'poor';
          points = 40;
          color = '#f97316';
        }

        beats.push({
          beatNumber: i,
          expectedTime,
          expectedInput: {
            beatNumber: i,
            expectedTypes: [expectedInputType],
            isAlternating: false,
          },
          actualInput: {
            type: expectedInputType,
            timestamp: actualTime,
            source: 'keyboard',
          },
          actualTime,
          deviation,
          isCorrectInput: true,
          isWrongInput: false,
          feedback: {
            category,
            deviation,
            direction: deviation > 0 ? 'late' : 'early',
            points,
            color,
            message: category.toUpperCase(),
            displayText: `${deviation > 0 ? '+' : ''}${Math.round(deviation)}ms`,
          },
        });
      } else {
        // 입력 없음 (miss)
        beats.push({
          beatNumber: i,
          expectedTime,
          expectedInput: {
            beatNumber: i,
            expectedTypes: [expectedInputType],
            isAlternating: false,
          },
          actualInput: null,
          actualTime: null,
          deviation: null,
          isCorrectInput: false,
          isWrongInput: false,
          feedback: {
            category: 'miss',
            deviation: 999,
            direction: 'late',
            points: 0,
            color: '#999999',
            message: 'MISSED',
            displayText: 'NO INPUT',
          },
        });
      }
    }

    // SessionResults 계산
    const responsiveBeats = beats.filter(b => b.actualInput !== null).length;
    const correctBeats = beats.filter(b => b.isCorrectInput).length;
    const missedBeats = beats.filter(b => b.actualInput === null).length;

    const perfectCount = beats.filter(b => b.feedback?.category === 'perfect').length;
    const excellentCount = beats.filter(b => b.feedback?.category === 'excellent').length;
    const goodCount = beats.filter(b => b.feedback?.category === 'good').length;
    const fairCount = beats.filter(b => b.feedback?.category === 'fair').length;
    const poorCount = beats.filter(b => b.feedback?.category === 'poor').length;
    const missCount = missedBeats;

    const taskAverage = deviations.length > 0
      ? deviations.reduce((a, b) => a + b, 0) / deviations.length
      : 999;

    // Class level 결정
    let classLevel: TimingClass = 4;
    if (test.trainingType === 'audio') {
      if (taskAverage < 25) classLevel = 7;
      else if (taskAverage < 30) classLevel = 6;
      else if (taskAverage < 35) classLevel = 5;
      else if (taskAverage < 45) classLevel = 4;
      else if (taskAverage < 105) classLevel = 3;
      else if (taskAverage < 150) classLevel = 2;
      else classLevel = 1;
    } else {
      if (taskAverage < 30) classLevel = 7;
      else if (taskAverage < 40) classLevel = 6;
      else if (taskAverage < 50) classLevel = 5;
      else if (taskAverage < 65) classLevel = 4;
      else if (taskAverage < 95) classLevel = 3;
      else if (taskAverage < 160) classLevel = 2;
      else classLevel = 1;
    }

    const totalPoints = beats.reduce((sum, b) => sum + (b.feedback?.points || 0), 0);
    const averagePoints = totalPoints / beats.length;

    // Consistency 계산
    const mean = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const variance = deviations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / deviations.length;
    const standardDeviation = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - standardDeviation);

    const earlyBeats = beats.filter(b => b.feedback?.direction === 'early').length;
    const lateBeats = beats.filter(b => b.feedback?.direction === 'late').length;
    const onTargetBeats = beats.filter(b => b.feedback?.category === 'perfect').length;

    const results: SessionResults = {
      taskAverage,
      classLevel,
      earlyHitPercent: Math.round((earlyBeats / totalBeats) * 100),
      lateHitPercent: Math.round((lateBeats / totalBeats) * 100),
      onTargetPercent: Math.round((onTargetBeats / totalBeats) * 100),
      totalBeats,
      responsiveBeats,
      missedBeats,
      wrongInputBeats: 0,
      responseRate: Math.round((responsiveBeats / totalBeats) * 100),
      accuracyRate: Math.round((correctBeats / totalBeats) * 100),
      perfectCount,
      excellentCount,
      goodCount,
      fairCount,
      poorCount,
      missCount,
      averagePoints,
      consistency,
      inputTypeStats: {},
    };

    const pattern: TrainingPattern =
      test.trainingRange === 'left'
        ? test.bodyPart === 'hand' ? 'left-hand-only' : 'left-foot-only'
        : test.bodyPart === 'hand' ? 'right-hand-only' : 'right-foot-only';

    const session: TrainingSession = {
      sessionId: `mock-${testIndex}-${Date.now()}`,
      sessionNumber: testIndex,
      date: new Date().toISOString(),
      startTime: Date.now() - (testIndex * 60000),
      endTime: Date.now() - (testIndex * 60000) + (durationSeconds * 1000),
      userProfile: mockUserProfile,
      settings: {
        trainingType: test.trainingType,
        bodyPart: test.bodyPart,
        trainingRange: test.trainingRange,
        bpm,
        durationMinutes: durationSeconds / 60,
        pattern,
      },
      beats,
      results,
    };

    sessions.push(session);
  });

  return sessions;
}
