# 시청각 타이밍 훈련 및 평가 프로그램

시각 및 청각 자극에 대한 타이밍 훈련과 종합 평가를 제공하는 웹 애플리케이션입니다.

## 주요 기능

### 1. 훈련 모드 (Training Mode)

#### 시각 훈련
- 전체화면을 좌우 2등분 (녹색/빨간색 영역)
- BPM에 맞춰 해당 영역 깜빡임
- 손/발 일러스트 표시
- 훈련 범위 선택: 왼쪽 / 오른쪽 / 양쪽

#### 청각 훈련
- 설정된 BPM에 맞춰 "삐" 소리 재생
- 모노 사운드 지원

#### 설정 옵션
- **훈련 타입**: 시각 / 청각
- **신체 부위**: 손 / 발
- **훈련 범위**: 왼쪽 / 오른쪽 / 양쪽
- **BPM**: 40-200 범위 조절
- **훈련 시간**: 1-5분

#### 실시간 피드백
- 6단계 타이밍 정확도 피드백 (Perfect/Excellent/Good/Fair/Poor/Miss)
- 입력 타이밍 편차 표시 (ms 단위)
- 점수 및 정확도 실시간 표시

### 2. 검사 모드 (Assessment Mode)

체계적인 타이밍 능력 평가를 위한 표준화된 검사 모드입니다.

#### 검사 구성
- **BPM**: 60 고정
- **검사 시간**: 각 검사당 40초
- **총 8개 순차 검사**:
  1. 왼손 청각
  2. 왼손 시각
  3. 오른손 청각
  4. 오른손 시각
  5. 왼발 청각
  6. 왼발 시각
  7. 오른발 청각
  8. 오른발 시각

#### 검사 진행 흐름
1. 검사 시작 화면 (순서 안내)
2. 각 검사별 5초 카운트다운
3. 40초간 검사 진행
4. 검사 완료 후 대기 화면
5. "다음 검사 시작" 버튼 또는 아무 키나 눌러 진행
6. 8개 검사 완료 후 종합 평가 리포트 표시

### 3. 종합 평가 리포트 (Comprehensive Assessment Report)

8개 검사 결과를 종합 분석하여 6가지 핵심 지표를 제공합니다.

#### Section 1: 시청각 학습능력
- **시각 처리 능력**
  - Task Average (ms)
  - Class Level (1-7)
  - 수준 (아주잘함 ~ 아주못함)
  - 백분위 (0-100%)
- **청각 처리 능력**
  - 동일한 지표로 측정
- **백분위 계산**: 정규 분포 기반 (Class 4 = 50th percentile)
  - Class 7 = 98th percentile
  - Class 6 = 90th percentile
  - Class 5 = 75th percentile
  - Class 4 = 50th percentile
  - Class 3 = 25th percentile
  - Class 2 = 10th percentile
  - Class 1 = 2nd percentile

#### Section 2: 학습 스타일
- **우성 스타일 결정**
  - 시각 우성 (visual > auditory by 5%+)
  - 청각 우성 (auditory > visual by 5%+)
  - 균형적 (차이 < 5%)
- 시각/청각 백분위 비교
- 차이 백분율 표시

#### Section 3: 시청각 주의력
- **표준편차 기반 주의력 측정**
  - 우수: SD < 20ms (85th percentile)
  - 보통: SD 20-40ms (30-70th percentile)
  - 미달: SD > 40ms (<30th percentile)
- 시각 주의력 / 청각 주의력 각각 평가

#### Section 4: 뇌 인지속도
- **전체 평균 Task Average**
  - 시각 + 청각 TA의 평균
- **수준 분류**
  - 우수: Class 5-7
  - 보통: Class 3-4
  - 미달: Class 1-2
- 백분위 순위

#### Section 5: 지속성 (Sustainability)
- **초반 vs 후반 성능 비교**
  - 초반 평균 (전반부 50%)
  - 후반 평균 (후반부 50%)
- **오류율**: 후반 성능이 저하된 경우
  - `((후반 - 초반) / 초반) × 100%`
- **향상율**: 후반 성능이 개선된 경우
  - `((초반 - 후반) / 초반) × 100%`
- 시각/청각 각각 평가

#### Section 6: 좌우뇌 균형도
- **신체-뇌 매핑**
  - 왼쪽 신체 (왼손 + 왼발) → 우뇌
  - 오른쪽 신체 (오른손 + 오른발) → 좌뇌
- **균형도 평가**
  - 높음: 차이 < 10%
  - 보통: 차이 10-20%
  - 낮음: 차이 > 20%
- 좌뇌/우뇌 백분율 시각화

#### 개별 검사 결과
- 8개 검사 각각의 상세 결과 테이블
  - 검사명
  - Task Average
  - Class Level
  - 정답률
  - 총 입력수

#### PDF 내보내기
- 전체 리포트를 PDF 파일로 저장
- 파일명: `[이름]_타이밍검사_[날짜].pdf`

### 4. 연령별 검사 기준표

Interactive Metronome (IM) 연구를 기반으로 한 연령별 평가 기준을 제공합니다.

#### 연령 그룹 (6개)
- 만 7세 미만
- 만 7-8세
- 만 9-10세
- 만 11-12세
- 만 13-17세
- 만 18세 이상

#### Class 기준 (7단계)
각 연령 그룹별로 Class 1-7의 TA 범위가 정의되어 있습니다.

- **시각 모드**: 시각 자극에 대한 반응 기준
- **청각 모드**: 청각 자극에 대한 반응 기준

기준표는 메인 화면의 "연령별 검사 기준표 보기" 버튼을 통해 확인 가능합니다.

### 5. 사용자 프로필 관리

#### 프로필 정보
- **이름**: 검사 결과에 표시
- **성별**: 남성 / 여성
- **생년월일**: 연령 자동 계산 (만 나이)
- **모드 선택**: 훈련 모드 / 검사 모드

#### 데이터 저장
- LocalStorage를 사용한 로컬 저장
- 서버 연결 불필요
- 프라이버시 보호

## 기술 스택

### 프레임워크 및 라이브러리
- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **차트**: Recharts (Electron/exe 호환)
- **PDF 생성**: jsPDF + html2canvas
- **패키지 매니저**: npm

### 주요 라이브러리
```json
{
  "next": "15.5.5",
  "react": "^19.0.0",
  "typescript": "^5",
  "recharts": "^2.x",
  "jspdf": "^2.x",
  "html2canvas": "^1.x"
}
```

## 설치 및 실행

### 1. 의존성 설치
```bash
cd timing-trainer
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속하세요.

### 3. 프로덕션 빌드
```bash
npm run build
npm start
```

## 프로젝트 구조

```
timing-trainer/
├── app/
│   ├── page.tsx               # 메인 화면 (프로필 입력 및 모드 선택)
│   ├── training/
│   │   └── page.tsx           # 훈련 모드 화면
│   ├── assessment/
│   │   └── page.tsx           # 검사 모드 화면
│   ├── standards/
│   │   └── page.tsx           # 연령별 검사 기준표
│   ├── layout.tsx             # 루트 레이아웃
│   └── globals.css            # 글로벌 스타일
├── components/
│   ├── TimingFeedback.tsx     # 실시간 타이밍 피드백
│   ├── SessionResults.tsx     # 세션 결과 화면 (훈련 모드용)
│   └── ComprehensiveAssessmentReport.tsx  # 종합 평가 리포트
├── utils/
│   ├── evaluator.ts           # 타이밍 평가 로직
│   └── assessmentReport.ts    # 종합 리포트 계산 로직
├── types/
│   ├── index.ts               # 기본 타입 정의
│   └── evaluation.ts          # 평가 관련 타입 정의
├── hooks/
│   └── useInputHandler.ts     # 키보드/터치 입력 핸들러
├── public/                    # 정적 파일
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 사용 방법

### 훈련 모드

1. **프로필 입력**
   - 이름 입력
   - 성별 선택 (남성/여성)
   - 생년월일 입력

2. **훈련 모드 선택**
   - "훈련 시작" 버튼 클릭

3. **훈련 설정**
   - 훈련 타입 선택 (시각 / 청각)
   - 신체 부위 선택 (손 / 발)
   - 훈련 범위 선택 (왼쪽 / 오른쪽 / 양쪽)
   - BPM 조절 (40-200)
   - 훈련 시간 설정 (1-5분)

4. **훈련 진행**
   - 자극(시각/청각)에 맞춰 입력
   - 실시간 피드백 확인
   - 정확도 및 점수 확인

5. **결과 확인**
   - Task Average, Class Level
   - 정답률, 응답률, 일관성 점수
   - Early/Late 반응 분포
   - 신체 부위별 상세 통계

### 검사 모드

1. **프로필 입력**
   - 이름, 성별, 생년월일 입력

2. **검사 모드 선택**
   - "검사 시작" 버튼 클릭

3. **검사 진행**
   - 검사 순서 확인
   - 각 검사별 5초 카운트다운 대기
   - 40초간 검사 진행 (60 BPM 고정)
   - "다음 검사 시작" 버튼 또는 아무 키나 눌러 다음 검사로 진행
   - 총 8개 검사 완료

4. **종합 리포트 확인**
   - 6가지 핵심 지표 확인
   - 개별 검사 결과 테이블 확인
   - PDF로 저장 가능

### 연령별 기준표 확인

1. 메인 화면에서 "연령별 검사 기준표 보기" 버튼 클릭
2. 시각 모드 / 청각 모드 탭 전환
3. 6개 연령 그룹별 Class 1-7 기준 확인

## 타이밍 평가 시스템

이 프로그램은 Interactive Metronome (IM) 연구를 기반으로 한 타이밍 평가 시스템을 구현하고 있습니다.

### 핵심 평가 지표

#### 1. Task Average (TA)
- **정의**: 모든 올바른 입력의 절대 편차(ms) 평균
- **계산**: `Σ|실제시간 - 예상시간| / 올바른 입력 수`
- **단위**: milliseconds (ms)
- **의미**: 낮을수록 정확한 타이밍 능력
- **구현**: `utils/evaluator.ts`

#### 2. Class Level (1-7)
TA 값을 연령별 기준에 따라 7단계로 분류:

| Class | 등급 | 의미 |
|-------|------|------|
| 7 | 아주 잘함 | 최상급 타이밍 능력 |
| 6 | 잘함 | 뛰어난 타이밍 능력 |
| 5 | 평균 이상 | 평균보다 높은 능력 |
| 4 | 평균 | 평균적인 능력 |
| 3 | 평균 이하 | 평균보다 낮은 능력 |
| 2 | 못함 | 심각한 타이밍 결핍 |
| 1 | 아주 못함 | 극심한 타이밍 결핍 |

**연령별 기준**: 6개 연령 그룹별로 Class 경계값이 다르게 적용됩니다.

#### 3. 백분위 (Percentile)
- **계산 방식**: 정규 분포 기반
- **기준**: Class 4를 50th percentile로 설정
- **의미**: 동일 연령대 대비 상대적 위치

#### 4. 표준편차 (Standard Deviation)
- **용도**: 주의력 및 일관성 측정
- **의미**: 낮을수록 일관된 타이밍 능력

#### 5. Response Distribution
- **Early Hit %**: 너무 빠른 반응 비율 (deviation < -5ms)
- **Late Hit %**: 너무 늦은 반응 비율 (deviation > +5ms)
- **On-Target %**: 정확한 타이밍 반응 비율 (|deviation| ≤ 5ms)

#### 6. Real-time Feedback
각 입력에 대한 즉각적인 6단계 피드백:

| 등급 | 편차 범위 | 점수 | 색상 |
|------|-----------|------|------|
| Perfect | ≤15ms | 100점 | 초록색 |
| Excellent | ≤30ms | 90점 | 연두색 |
| Good | ≤50ms | 75점 | 황록색 |
| Fair | ≤80ms | 60점 | 노란색 |
| Poor | ≤120ms | 40점 | 주황색 |
| Miss | >120ms | 0점 | 빨간색 |

### 연령별 평가 기준 (AGE_BASED_STANDARDS)

#### 연령 그룹 정의
```typescript
'under7'    // 만 7세 미만
'age7to8'   // 만 7-8세
'age9to10'  // 만 9-10세
'age11to12' // 만 11-12세
'age13to17' // 만 13-17세
'adult'     // 만 18세 이상
```

#### 모드별 기준
- **시각 모드 (visual)**: 시각 자극에 대한 반응 기준
- **청각 모드 (auditory)**: 청각 자극에 대한 반응 기준

각 연령 그룹과 모드 조합마다 Class 1-7의 TA 범위가 정의되어 있습니다.

### 종합 리포트 계산 로직

#### 처리 능력 (Processing Capability)
```typescript
// 시각 처리 능력: 왼손 시각 + 오른손 시각 + 왼발 시각 + 오른발 시각
// 청각 처리 능력: 왼손 청각 + 오른손 청각 + 왼발 청각 + 오른발 청각
```

#### 학습 스타일 (Learning Style)
```typescript
const difference = Math.abs(visualPercentile - auditoryPercentile);
if (difference < 5) return "균형적";
return visualPercentile > auditoryPercentile ? "시각우성" : "청각우성";
```

#### 주의력 (Attention)
```typescript
const variance = deviations.reduce((sum, d) => sum + Math.pow(d, 2), 0) / deviations.length;
const standardDeviation = Math.sqrt(variance);

if (sd < 20) return { level: "우수", percentile: 85 };
if (sd < 40) return { level: "보통", percentile: 50 };
return { level: "미달", percentile: 15 };
```

#### 지속성 (Sustainability)
```typescript
const midpoint = Math.floor(allDeviations.length / 2);
const earlyAverage = mean(allDeviations.slice(0, midpoint));
const lateAverage = mean(allDeviations.slice(midpoint));

if (lateAverage > earlyAverage) {
  errorRate = ((lateAverage - earlyAverage) / earlyAverage) * 100;
} else {
  improvementRate = ((earlyAverage - lateAverage) / earlyAverage) * 100;
}
```

#### 좌우뇌 균형도 (Hemisphere Balance)
```typescript
// 왼쪽 신체 (왼손 + 왼발) = 우뇌
// 오른쪽 신체 (오른손 + 오른발) = 좌뇌

const leftSideAverage = (leftHandTA + leftFootTA) / 2;
const rightSideAverage = (rightHandTA + rightFootTA) / 2;

// 낮은 TA = 더 좋은 성능 = 더 높은 백분율
const rightBrain = Math.round((rightSideAverage / total) * 100);
const leftBrain = 100 - rightBrain;

const difference = Math.abs(leftBrain - rightBrain);
if (difference < 10) return "높음";
if (difference < 20) return "보통";
return "낮음";
```

## 입력 처리

### 지원 입력 방식

#### 키보드 입력
- **왼손**: Q, W, E, A, S, D, Z, X, C 키
- **오른손**: U, I, O, J, K, L, M, <, > 키
- **왼발**: 1, 2, 3 키
- **오른발**: 8, 9, 0 키

#### 터치 입력 (모바일)
- 화면 좌측/우측 영역 터치
- 신체 부위별 입력 자동 매핑

### 입력 검증
- **비트 매칭**: 가장 가까운 예상 비트 자동 찾기 (±500ms 허용)
- **중복 방지**: 이미 입력된 비트는 재입력 불가
- **올바른 입력**: 예상된 신체 부위와 일치하는 입력만 정답 처리

## Vercel 배포 (Phase 1 - 웹 프로토타입)

### 방법 1: Vercel CLI 사용

1. Vercel CLI 설치
```bash
npm install -g vercel
```

2. 프로젝트 디렉토리에서 배포
```bash
cd timing-trainer
vercel
```

3. 프로덕션 배포
```bash
vercel --prod
```

### 방법 2: Vercel 웹 인터페이스 사용

1. [Vercel](https://vercel.com) 접속 및 로그인
2. "Import Project" 클릭
3. Git 저장소 연결 또는 직접 업로드
4. 프로젝트 설정:
   - Framework Preset: Next.js
   - Root Directory: timing-trainer (하위 디렉토리인 경우)
5. "Deploy" 클릭

배포 후 제공되는 URL을 통해 어디서든 접속 가능합니다.

## Phase 2: 데스크톱 애플리케이션 변환 (예정)

웹 프로토타입 검수 완료 후, Electron 또는 Tauri를 사용하여 Windows 실행 파일(.exe)로 변환합니다.

### 예상 변환 도구
- **Electron**: 더 많은 자료와 커뮤니티 지원
- **Tauri**: 더 가볍고 빠른 실행 파일

### 시스템 요구사항
- Windows 10 이상
- 저사양 PC 지원 (Celeron, RAM 4GB)
- 전체화면 모드
- 오프라인 실행 가능

### 패키징 고려사항
- Recharts는 Electron과 완벽 호환
- PDF 생성 기능은 로컬 파일 시스템 사용
- LocalStorage는 Electron의 userData 디렉토리로 이전

## 특징

### 훈련 모드
- 간단하고 직관적인 UI/UX
- 실시간 타이밍 피드백
- 신체 부위별 상세 통계
- 유연한 BPM 및 시간 설정

### 검사 모드
- 표준화된 평가 프로토콜
- 8개 순차 검사로 종합 평가
- 과학적 근거 기반 평가 지표
- 연령별 규준 적용
- 종합 리포트 및 PDF 내보내기

### 기술적 특징
- 서버 연결, 로그인, 데이터베이스 불필요
- 최소한의 리소스 사용 (저사양 PC 지원)
- 크로스 플랫폼 지원 (웹 기반)
- 모바일 터치 입력 지원
- 키보드 입력 지원
- LocalStorage 기반 프라이버시 보호

## 개발 단계

### Phase 1: 웹 프로토타입 (현재)
- [x] Next.js 프로젝트 설정
- [x] 사용자 프로필 입력 화면
- [x] 훈련 모드 구현
  - [x] 시각 훈련
  - [x] 청각 훈련
  - [x] 실시간 피드백
  - [x] 세션 결과 화면
- [x] 검사 모드 구현
  - [x] 8개 순차 검사
  - [x] 5초 카운트다운
  - [x] 검사 진행 UI
  - [x] 종합 평가 리포트
- [x] 연령별 검사 기준표
- [x] 타이밍 평가 시스템
  - [x] TA 계산
  - [x] Class 분류
  - [x] 백분위 계산
  - [x] 주의력 평가 (표준편차)
  - [x] 지속성 평가
  - [x] 좌우뇌 균형도
- [x] PDF 내보내기 기능
- [x] 모바일 터치 입력 지원
- [x] 전체화면 모드 및 제어 기능
- [ ] Vercel 배포
- [ ] 기능 검수 및 피드백 반영

### Phase 2: 데스크톱 변환 (예정)
- [ ] Electron/Tauri 패키징
- [ ] Windows 실행 파일 생성
- [ ] 저사양 PC 최적화
- [ ] 설치 프로그램 제작
- [ ] 로컬 데이터 저장 시스템

### Phase 3: 고도화 (선택사항)
- [ ] 세션 추적 시스템 (70세션 목표)
- [ ] 진행도 그래프
- [ ] 4단계 훈련 모델 (Stage 1-4)
- [ ] 자동 난이도 조정
- [ ] 데이터 Export (JSON/CSV)
- [ ] 클라우드 동기화 (선택)

## 참고 문헌

연구 기반:
- Chung et al. (2022): Brain timing training effects on reading in children
- McGrew (2013): Neurophysiological mechanism of IM
- Cassily & Jacokes (2001): Test-retest reliability
- Bonacina et al. (2018), Ritter et al. (2013): Reading correlation studies

## 문의 및 피드백

프로젝트에 대한 문의나 피드백은 개발자에게 직접 전달해주세요.

## 라이선스

이 프로젝트는 개인 사용을 위한 프로젝트입니다.
