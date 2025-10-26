'use client';

import { useRouter } from 'next/navigation';
import { AGE_BASED_STANDARDS, AgeGroup } from '@/types/evaluation';

const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  'under7': '7세 미만',
  '8-9': '8-9세',
  '10-11': '10-11세',
  '12-13': '12-13세',
  '14-16': '14-16세',
  'over17': '17세 이상',
};

const CLASS_LABELS: Record<number, string> = {
  7: 'Class 7 (아주 잘함)',
  6: 'Class 6 (잘함)',
  5: 'Class 5 (정상 이상)',
  4: 'Class 4 (정상)',
  3: 'Class 3 (경미한 결핍)',
  2: 'Class 2 (중등도 결핍)',
  1: 'Class 1 (극심한 결핍)',
};

export default function StandardsPage() {
  const router = useRouter();

  const ageGroups: AgeGroup[] = ['under7', '8-9', '10-11', '12-13', '14-16', 'over17'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              연령별 타이밍 평가 기준표
            </h1>
            <p className="text-gray-600">
              QTrainer 표준 규준표 기반 (Task Average 기준, ms 단위)
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            홈으로
          </button>
        </div>

        {/* 청각 모드 기준표 */}
        <div className="mb-12 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">청각 모드 (Auditory) 기준</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Class
                  </th>
                  {ageGroups.map((ageGroup) => (
                    <th
                      key={ageGroup}
                      className="px-6 py-3 text-center text-sm font-semibold text-gray-700"
                    >
                      {AGE_GROUP_LABELS[ageGroup]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[7, 6, 5, 4, 3, 2, 1].map((classNum) => (
                  <tr key={classNum} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {CLASS_LABELS[classNum]}
                    </td>
                    {ageGroups.map((ageGroup) => {
                      const standard = AGE_BASED_STANDARDS.auditory[ageGroup].find(
                        (s) => s.class === classNum
                      );
                      if (!standard) return <td key={ageGroup} className="px-6 py-4 text-center text-sm text-gray-500">-</td>;

                      const [min, max] = standard.range;
                      return (
                        <td key={ageGroup} className="px-6 py-4 text-center text-sm text-gray-700">
                          {min === 0 ? '0' : min}
                          {' ~ '}
                          {max === Infinity ? '∞' : max}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 시각 모드 기준표 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-green-600 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">시각 모드 (Visual) 기준</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Class
                  </th>
                  {ageGroups.map((ageGroup) => (
                    <th
                      key={ageGroup}
                      className="px-6 py-3 text-center text-sm font-semibold text-gray-700"
                    >
                      {AGE_GROUP_LABELS[ageGroup]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[7, 6, 5, 4, 3, 2, 1].map((classNum) => (
                  <tr key={classNum} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {CLASS_LABELS[classNum]}
                    </td>
                    {ageGroups.map((ageGroup) => {
                      const standard = AGE_BASED_STANDARDS.visual[ageGroup].find(
                        (s) => s.class === classNum
                      );
                      if (!standard) return <td key={ageGroup} className="px-6 py-4 text-center text-sm text-gray-500">-</td>;

                      const [min, max] = standard.range;
                      return (
                        <td key={ageGroup} className="px-6 py-4 text-center text-sm text-gray-700">
                          {min === 0 ? '0' : min}
                          {' ~ '}
                          {max === Infinity ? '∞' : max}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 설명 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">평가 기준 안내</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Task Average (TA)</strong>: 모든 응답의 평균 절대 편차 (ms)</li>
            <li>• <strong>청각 모드</strong>: 소리 신호에 맞춰 반응하는 검사</li>
            <li>• <strong>시각 모드</strong>: 시각 신호에 맞춰 반응하는 검사 (청각보다 기준이 높음)</li>
            <li>• Class 7이 가장 우수한 수준, Class 1이 극심한 결핍 수준입니다</li>
            <li>• 연령이 높아질수록 더 엄격한 기준이 적용됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
