import ExcelJS from 'exceljs';
import { ComprehensiveAssessmentReport } from '@/types/evaluation';

/**
 * 검사 결과를 Excel 파일로 저장하는 함수
 */
export async function exportToExcel(report: ComprehensiveAssessmentReport): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  // 메타데이터 설정
  workbook.creator = 'Timing Trainer';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ============================================================================
  // 시트 1: 환자 정보 및 종합 결과
  // ============================================================================
  const summarySheet = workbook.addWorksheet('종합 결과', {
    properties: { tabColor: { argb: 'FF4A90E2' } }
  });

  // 제목
  summarySheet.mergeCells('A1:F1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = '타이밍 검사 종합 결과';
  titleCell.font = { size: 18, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 30;

  // 환자 정보
  summarySheet.getRow(3).height = 25;
  summarySheet.getCell('A3').value = '환자 정보';
  summarySheet.getCell('A3').font = { bold: true, size: 14 };
  summarySheet.getCell('A3').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE3F2FD' }
  };

  const patientInfo = [
    ['이름', report.patientInfo.name],
    ['성별', report.patientInfo.gender === 'male' ? '남성' : '여성'],
    ['나이', `만 ${report.patientInfo.age}세`],
    ['검사일', report.patientInfo.testDate],
  ];

  let currentRow = 4;
  patientInfo.forEach(([label, value]) => {
    summarySheet.getCell(`A${currentRow}`).value = label;
    summarySheet.getCell(`B${currentRow}`).value = value;
    summarySheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;
  });

  // 1. 시청각 학습능력
  currentRow += 2;
  summarySheet.getCell(`A${currentRow}`).value = '1. 시청각 학습능력';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
  summarySheet.getCell(`A${currentRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F5E9' }
  };
  currentRow++;

  // 시각 처리 능력
  summarySheet.getCell(`A${currentRow}`).value = '시각 처리 능력';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true };
  currentRow++;

  const visualData = [
    ['Task Average', `${report.processingCapability.visual.taskAverage}ms`],
    ['Class', report.processingCapability.visual.classLevel],
    ['수준', report.processingCapability.visual.level],
    ['백분위', `${report.processingCapability.visual.percentile}%`],
  ];

  visualData.forEach(([label, value]) => {
    summarySheet.getCell(`B${currentRow}`).value = label;
    summarySheet.getCell(`C${currentRow}`).value = value;
    currentRow++;
  });

  currentRow++;
  // 청각 처리 능력
  summarySheet.getCell(`A${currentRow}`).value = '청각 처리 능력';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true };
  currentRow++;

  const auditoryData = [
    ['Task Average', `${report.processingCapability.auditory.taskAverage}ms`],
    ['Class', report.processingCapability.auditory.classLevel],
    ['수준', report.processingCapability.auditory.level],
    ['백분위', `${report.processingCapability.auditory.percentile}%`],
  ];

  auditoryData.forEach(([label, value]) => {
    summarySheet.getCell(`B${currentRow}`).value = label;
    summarySheet.getCell(`C${currentRow}`).value = value;
    currentRow++;
  });

  // 2. 학습 스타일
  currentRow += 2;
  summarySheet.getCell(`A${currentRow}`).value = '2. 학습 스타일';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
  summarySheet.getCell(`A${currentRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3E5F5' }
  };
  currentRow++;

  const learningStyleData = [
    ['우성 스타일', report.learningStyle.dominantLabel],
    ['차이', `${report.learningStyle.difference}%`],
  ];

  learningStyleData.forEach(([label, value]) => {
    summarySheet.getCell(`A${currentRow}`).value = label;
    summarySheet.getCell(`B${currentRow}`).value = value;
    summarySheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;
  });

  // 3. 시청각 주의력
  currentRow += 2;
  summarySheet.getCell(`A${currentRow}`).value = '3. 시청각 주의력';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
  summarySheet.getCell(`A${currentRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF3E0' }
  };
  currentRow++;

  summarySheet.getCell(`A${currentRow}`).value = '시각 주의력';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true };
  currentRow++;

  const visualAttentionData = [
    ['표준편차', `${report.attention.visual.standardDeviation}ms`],
    ['수준', report.attention.visual.level],
    ['백분위', `${report.attention.visual.percentile}%`],
  ];

  visualAttentionData.forEach(([label, value]) => {
    summarySheet.getCell(`B${currentRow}`).value = label;
    summarySheet.getCell(`C${currentRow}`).value = value;
    currentRow++;
  });

  currentRow++;
  summarySheet.getCell(`A${currentRow}`).value = '청각 주의력';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true };
  currentRow++;

  const auditoryAttentionData = [
    ['표준편차', `${report.attention.auditory.standardDeviation}ms`],
    ['수준', report.attention.auditory.level],
    ['백분위', `${report.attention.auditory.percentile}%`],
  ];

  auditoryAttentionData.forEach(([label, value]) => {
    summarySheet.getCell(`B${currentRow}`).value = label;
    summarySheet.getCell(`C${currentRow}`).value = value;
    currentRow++;
  });

  // 4. 뇌 인지속도
  currentRow += 2;
  summarySheet.getCell(`A${currentRow}`).value = '4. 뇌 인지속도';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
  summarySheet.getCell(`A${currentRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFEBEE' }
  };
  currentRow++;

  const brainSpeedData = [
    ['평균 Task Average', `${report.brainSpeed.taskAverage}ms`],
    ['수준', report.brainSpeed.level],
    ['백분위', `${report.brainSpeed.percentile}%`],
  ];

  brainSpeedData.forEach(([label, value]) => {
    summarySheet.getCell(`A${currentRow}`).value = label;
    summarySheet.getCell(`B${currentRow}`).value = value;
    summarySheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;
  });

  // 5. 지속성
  currentRow += 2;
  summarySheet.getCell(`A${currentRow}`).value = '5. 지속성';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
  summarySheet.getCell(`A${currentRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0F2F1' }
  };
  currentRow++;

  summarySheet.getCell(`A${currentRow}`).value = '시각 지속성';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true };
  currentRow++;

  const visualSustainabilityData = [
    ['초반 평균', `${report.sustainability.visual.earlyAverage}ms`],
    ['후반 평균', `${report.sustainability.visual.lateAverage}ms`],
    ['오류율', `${report.sustainability.visual.errorRate}%`],
    ['향상율', `${report.sustainability.visual.improvementRate}%`],
  ];

  visualSustainabilityData.forEach(([label, value]) => {
    summarySheet.getCell(`B${currentRow}`).value = label;
    summarySheet.getCell(`C${currentRow}`).value = value;
    currentRow++;
  });

  currentRow++;
  summarySheet.getCell(`A${currentRow}`).value = '청각 지속성';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true };
  currentRow++;

  const auditorySustainabilityData = [
    ['초반 평균', `${report.sustainability.auditory.earlyAverage}ms`],
    ['후반 평균', `${report.sustainability.auditory.lateAverage}ms`],
    ['오류율', `${report.sustainability.auditory.errorRate}%`],
    ['향상율', `${report.sustainability.auditory.improvementRate}%`],
  ];

  auditorySustainabilityData.forEach(([label, value]) => {
    summarySheet.getCell(`B${currentRow}`).value = label;
    summarySheet.getCell(`C${currentRow}`).value = value;
    currentRow++;
  });

  // 6. 좌우뇌 균형도
  currentRow += 2;
  summarySheet.getCell(`A${currentRow}`).value = '6. 좌우뇌 균형도';
  summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
  summarySheet.getCell(`A${currentRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8EAF6' }
  };
  currentRow++;

  const hemisphereData = [
    ['좌뇌', `${report.hemisphereBalance.leftBrain}%`],
    ['우뇌', `${report.hemisphereBalance.rightBrain}%`],
    ['균형도', report.hemisphereBalance.correlation],
    ['차이', `${report.hemisphereBalance.difference}%`],
  ];

  hemisphereData.forEach(([label, value]) => {
    summarySheet.getCell(`A${currentRow}`).value = label;
    summarySheet.getCell(`B${currentRow}`).value = value;
    summarySheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;
  });

  // 열 너비 조정
  summarySheet.getColumn('A').width = 20;
  summarySheet.getColumn('B').width = 20;
  summarySheet.getColumn('C').width = 20;

  // ============================================================================
  // 시트 2: 개별 검사 결과
  // ============================================================================
  const detailSheet = workbook.addWorksheet('개별 검사 결과', {
    properties: { tabColor: { argb: 'FF50C878' } }
  });

  // 제목
  detailSheet.mergeCells('A1:F1');
  const detailTitleCell = detailSheet.getCell('A1');
  detailTitleCell.value = '개별 검사 결과';
  detailTitleCell.font = { size: 16, bold: true };
  detailTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  detailSheet.getRow(1).height = 30;

  // 헤더
  const headers = ['검사명', 'Task Average (ms)', 'Class', '정답률 (%)', '총 입력수', '응답률 (%)'];
  detailSheet.getRow(3).height = 25;
  headers.forEach((header, index) => {
    const cell = detailSheet.getCell(3, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A90E2' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // 데이터 행
  report.individualResults.forEach((result, index) => {
    const rowNum = index + 4;
    const row = detailSheet.getRow(rowNum);

    row.getCell(1).value = result.testName;
    row.getCell(2).value = Math.round(result.sessionResults.taskAverage);
    row.getCell(3).value = result.sessionResults.classLevel;
    row.getCell(4).value = result.sessionResults.accuracyRate;
    row.getCell(5).value = result.sessionResults.totalInputs;
    row.getCell(6).value = result.sessionResults.responseRate;

    // 정렬 및 테두리
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // 짝수 행 배경색
    if (index % 2 === 1) {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      });
    }
  });

  // 열 너비 조정
  detailSheet.getColumn(1).width = 20;
  detailSheet.getColumn(2).width = 18;
  detailSheet.getColumn(3).width = 10;
  detailSheet.getColumn(4).width = 15;
  detailSheet.getColumn(5).width = 15;
  detailSheet.getColumn(6).width = 15;

  // ============================================================================
  // 파일 저장
  // ============================================================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.patientInfo.name}_타이밍검사_${report.patientInfo.testDate}.xlsx`;
  link.click();

  // 메모리 정리
  window.URL.revokeObjectURL(url);
}
