import { ComprehensiveAssessmentReport } from '@/types/evaluation';

/**
 * Google Sheets Web App URL
 *
 * 설정 방법:
 * 1. .env.local 파일에 NEXT_PUBLIC_GOOGLE_SHEETS_URL 환경변수 설정
 * 2. 또는 아래 상수를 직접 수정
 *
 * 예: https://script.google.com/macros/s/AKfycby.../exec
 */
const GOOGLE_SHEETS_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL || '';

/**
 * ComprehensiveAssessmentReport를 Google Sheets에 저장할 수 있는 형태로 변환
 */
function formatDataForGoogleSheets(report: ComprehensiveAssessmentReport) {
  const results = report.individualResults.map((individualResult) => {
    const { testName, sessionResults } = individualResult;
    const session = report.sessions.find(s => {
      const sessionTestName = `${
        s.settings.trainingRange === 'left' ? '왼' : '오른'
      }${
        s.settings.bodyPart === 'hand' ? '손' : '발'
      } ${
        s.settings.trainingType === 'audio' ? '청각' : '시각'
      }`;
      return sessionTestName === testName;
    });

    // 표준편차 계산 (정답인 비트들의 deviation으로부터)
    let standardDeviation = 0;
    if (session) {
      const deviations = session.beats
        .filter(b => b.deviation !== null && b.isCorrectInput)
        .map(b => Math.abs(b.deviation!));

      if (deviations.length > 0) {
        const mean = deviations.reduce((a, b) => a + b, 0) / deviations.length;
        const variance = deviations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / deviations.length;
        standardDeviation = Math.sqrt(variance);
      }
    }

    // 날짜와 시간 분리
    const dateObj = new Date(report.patientInfo.testDate);
    const date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = session
      ? new Date(session.startTime).toTimeString().split(' ')[0] // HH:MM:SS
      : dateObj.toTimeString().split(' ')[0];

    return {
      date,
      time,
      name: report.patientInfo.name,
      gender: report.patientInfo.gender === 'male' ? '남' : '여',
      age: report.patientInfo.age,
      testName,
      taskAverage: Math.round(sessionResults.taskAverage),
      classLevel: sessionResults.classLevel,
      accuracyRate: sessionResults.accuracyRate,
      responseRate: sessionResults.responseRate,
      perfectCount: sessionResults.perfectCount,
      excellentCount: sessionResults.excellentCount,
      goodCount: sessionResults.goodCount,
      fairCount: sessionResults.fairCount,
      poorCount: sessionResults.poorCount,
      missCount: sessionResults.missCount,
      earlyHitPercent: sessionResults.earlyHitPercent,
      lateHitPercent: sessionResults.lateHitPercent,
      onTargetPercent: sessionResults.onTargetPercent,
      standardDeviation: Math.round(standardDeviation),
    };
  });

  return { results };
}

/**
 * Google Sheets에 검사 결과를 저장하는 함수
 *
 * @param report - 저장할 검사 결과 리포트
 * @throws Error - Google Sheets URL이 설정되지 않았거나 저장 실패 시
 */
export async function exportToGoogleSheets(
  report: ComprehensiveAssessmentReport
): Promise<void> {
  // URL 검증
  if (!GOOGLE_SHEETS_URL) {
    throw new Error(
      'Google Sheets URL이 설정되지 않았습니다.\n\n' +
      '설정 방법:\n' +
      '1. docs/GOOGLE_SHEETS_SETUP.md 파일을 참고하여 Google Sheets Apps Script 설정\n' +
      '2. .env.local 파일에 NEXT_PUBLIC_GOOGLE_SHEETS_URL 환경변수 추가\n' +
      '또는\n' +
      '2. utils/googleSheetsExport.ts의 GOOGLE_SHEETS_URL 상수 수정'
    );
  }

  // 데이터 포맷 변환
  const data = formatDataForGoogleSheets(report);

  try {
    // Google Sheets Web App으로 데이터 전송
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script는 CORS를 지원하지 않음
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // no-cors 모드에서는 응답을 읽을 수 없지만, 에러가 없으면 성공으로 간주
    console.log('Google Sheets에 데이터 전송 완료:', data.results.length, '행');

  } catch (error) {
    console.error('Google Sheets 저장 실패:', error);
    throw new Error(
      'Google Sheets에 데이터를 저장하는 중 오류가 발생했습니다.\n\n' +
      '가능한 원인:\n' +
      '1. Google Sheets Web App URL이 올바르지 않음\n' +
      '2. Google Apps Script 배포 시 액세스 권한이 "모든 사용자"로 설정되지 않음\n' +
      '3. 네트워크 연결 문제\n\n' +
      '자세한 내용은 브라우저 콘솔을 확인하세요.'
    );
  }
}

/**
 * Google Sheets URL이 설정되어 있는지 확인
 */
export function isGoogleSheetsConfigured(): boolean {
  return !!GOOGLE_SHEETS_URL && GOOGLE_SHEETS_URL.length > 0;
}
