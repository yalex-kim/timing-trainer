'use client';

import React, { useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ComprehensiveAssessmentReport } from '@/types/evaluation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  report: ComprehensiveAssessmentReport;
  onClose: () => void;
}

export default function ComprehensiveAssessmentReportComponent({ report, onClose }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);

  // PDF Export
  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${report.patientInfo.name}_타이밍검사_${report.patientInfo.testDate}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF 생성에 실패했습니다.');
    }
  };

  // Get color based on percentile
  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 75) return '#10b981'; // green
    if (percentile >= 50) return '#3b82f6'; // blue
    if (percentile >= 25) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  // Get level color
  const getLevelColor = (level: string): string => {
    if (level === '우수' || level.includes('잘함')) return '#10b981';
    if (level === '보통' || level.includes('정상')) return '#3b82f6';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div ref={reportRef} className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8">
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-6 mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
            종합 타이밍 검사 결과
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">이름</div>
              <div className="text-lg font-bold">{report.patientInfo.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">성별</div>
              <div className="text-lg font-bold">
                {report.patientInfo.gender === 'male' ? '남성' : '여성'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">나이</div>
              <div className="text-lg font-bold">만 {report.patientInfo.age}세</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">검사일</div>
              <div className="text-lg font-bold">{report.patientInfo.testDate}</div>
            </div>
          </div>
        </div>

        {/* Section 1: Processing Capability */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">1</span>
            시청각 학습능력
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Visual Processing */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">시각 처리 능력</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Task Average:</span>
                  <span className="font-bold">{report.processingCapability.visual.taskAverage}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Class:</span>
                  <span className="font-bold">{report.processingCapability.visual.classLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">수준:</span>
                  <span className="font-bold" style={{ color: getLevelColor(report.processingCapability.visual.level) }}>
                    {report.processingCapability.visual.level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">백분위:</span>
                  <span className="font-bold text-xl" style={{ color: getPercentileColor(report.processingCapability.visual.percentile) }}>
                    {report.processingCapability.visual.percentile}%
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{
                      width: `${report.processingCapability.visual.percentile}%`,
                      backgroundColor: getPercentileColor(report.processingCapability.visual.percentile),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Auditory Processing */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">청각 처리 능력</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Task Average:</span>
                  <span className="font-bold">{report.processingCapability.auditory.taskAverage}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Class:</span>
                  <span className="font-bold">{report.processingCapability.auditory.classLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">수준:</span>
                  <span className="font-bold" style={{ color: getLevelColor(report.processingCapability.auditory.level) }}>
                    {report.processingCapability.auditory.level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">백분위:</span>
                  <span className="font-bold text-xl" style={{ color: getPercentileColor(report.processingCapability.auditory.percentile) }}>
                    {report.processingCapability.auditory.percentile}%
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{
                      width: `${report.processingCapability.auditory.percentile}%`,
                      backgroundColor: getPercentileColor(report.processingCapability.auditory.percentile),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Learning Style */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">2</span>
            학습 스타일
          </h2>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold mb-2" style={{
                color: report.learningStyle.dominantStyle === 'balanced' ? '#8b5cf6' :
                       report.learningStyle.dominantStyle === 'visual' ? '#3b82f6' : '#10b981'
              }}>
                {report.learningStyle.dominantLabel}
              </div>
              <div className="text-gray-600">
                차이: {report.learningStyle.difference}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">시각</div>
                <div className="text-2xl font-bold text-blue-600">
                  {report.processingCapability.visual.percentile}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">청각</div>
                <div className="text-2xl font-bold text-green-600">
                  {report.processingCapability.auditory.percentile}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Attention */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">3</span>
            시청각 주의력
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Visual Attention */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">시각 주의력</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">표준편차:</span>
                  <span className="font-bold">{report.attention.visual.standardDeviation}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">수준:</span>
                  <span className="font-bold" style={{ color: getLevelColor(report.attention.visual.level) }}>
                    {report.attention.visual.level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">백분위:</span>
                  <span className="font-bold text-xl" style={{ color: getPercentileColor(report.attention.visual.percentile) }}>
                    {report.attention.visual.percentile}%
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{
                      width: `${report.attention.visual.percentile}%`,
                      backgroundColor: getPercentileColor(report.attention.visual.percentile),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Auditory Attention */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">청각 주의력</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">표준편차:</span>
                  <span className="font-bold">{report.attention.auditory.standardDeviation}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">수준:</span>
                  <span className="font-bold" style={{ color: getLevelColor(report.attention.auditory.level) }}>
                    {report.attention.auditory.level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">백분위:</span>
                  <span className="font-bold text-xl" style={{ color: getPercentileColor(report.attention.auditory.percentile) }}>
                    {report.attention.auditory.percentile}%
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{
                      width: `${report.attention.auditory.percentile}%`,
                      backgroundColor: getPercentileColor(report.attention.auditory.percentile),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Brain Speed */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">4</span>
            뇌 인지속도
          </h2>

          <div className="bg-red-50 p-6 rounded-lg">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">평균 Task Average</div>
                <div className="text-3xl font-bold text-gray-800">{report.brainSpeed.taskAverage}ms</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">수준</div>
                <div className="text-3xl font-bold" style={{ color: getLevelColor(report.brainSpeed.level) }}>
                  {report.brainSpeed.level}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">백분위</div>
                <div className="text-3xl font-bold" style={{ color: getPercentileColor(report.brainSpeed.percentile) }}>
                  {report.brainSpeed.percentile}%
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className="h-6 rounded-full transition-all flex items-center justify-center text-white text-sm font-bold"
                  style={{
                    width: `${report.brainSpeed.percentile}%`,
                    backgroundColor: getPercentileColor(report.brainSpeed.percentile),
                  }}
                >
                  {report.brainSpeed.percentile}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Sustainability */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-teal-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">5</span>
            지속성
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Visual Sustainability */}
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">시각 지속성</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">초반 평균</span>
                    <span className="font-bold">{report.sustainability.visual.earlyAverage}ms</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">후반 평균</span>
                    <span className="font-bold">{report.sustainability.visual.lateAverage}ms</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">오류율</span>
                    <span className="font-bold text-red-600">{report.sustainability.visual.errorRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: `${Math.min(100, report.sustainability.visual.errorRate)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">향상율</span>
                    <span className="font-bold text-green-600">{report.sustainability.visual.improvementRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${Math.min(100, report.sustainability.visual.improvementRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Auditory Sustainability */}
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">청각 지속성</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">초반 평균</span>
                    <span className="font-bold">{report.sustainability.auditory.earlyAverage}ms</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">후반 평균</span>
                    <span className="font-bold">{report.sustainability.auditory.lateAverage}ms</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">오류율</span>
                    <span className="font-bold text-red-600">{report.sustainability.auditory.errorRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: `${Math.min(100, report.sustainability.auditory.errorRate)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">향상율</span>
                    <span className="font-bold text-green-600">{report.sustainability.auditory.improvementRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${Math.min(100, report.sustainability.auditory.improvementRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Hemisphere Balance */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">6</span>
            좌우뇌 균형도
          </h2>

          <div className="bg-indigo-50 p-6 rounded-lg">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">좌뇌</div>
                <div className="text-4xl font-bold text-blue-600">{report.hemisphereBalance.leftBrain}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">균형도</div>
                <div className="text-3xl font-bold" style={{
                  color: report.hemisphereBalance.correlation === '높음' ? '#10b981' :
                         report.hemisphereBalance.correlation === '보통' ? '#f59e0b' : '#ef4444'
                }}>
                  {report.hemisphereBalance.correlation}
                </div>
                <div className="text-sm text-gray-500 mt-1">차이: {report.hemisphereBalance.difference}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">우뇌</div>
                <div className="text-4xl font-bold text-purple-600">{report.hemisphereBalance.rightBrain}%</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-8 flex overflow-hidden">
                <div
                  className="bg-blue-500 flex items-center justify-center text-white font-bold"
                  style={{ width: `${report.hemisphereBalance.leftBrain}%` }}
                >
                  {report.hemisphereBalance.leftBrain}%
                </div>
                <div
                  className="bg-purple-500 flex items-center justify-center text-white font-bold"
                  style={{ width: `${report.hemisphereBalance.rightBrain}%` }}
                >
                  {report.hemisphereBalance.rightBrain}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Test Results */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">개별 검사 결과</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">검사명</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Task Average</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Class</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">정답률</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">총 입력수</th>
                </tr>
              </thead>
              <tbody>
                {report.individualResults.map((result, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {result.testName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-bold">
                      {Math.round(result.sessionResults.taskAverage)}ms
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className="font-bold text-lg">
                        {result.sessionResults.classLevel}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {result.sessionResults.accuracyRate}%
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {result.sessionResults.totalInputs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-8 pt-6 border-t-2 border-gray-200">
          <button
            onClick={handleExportPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            <span>📄</span>
            <span>PDF로 저장</span>
          </button>

          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
