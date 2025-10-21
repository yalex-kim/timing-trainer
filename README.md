# 시청각 타이밍 훈련 프로그램

시각 및 청각 자극에 대한 타이밍 훈련용 웹 애플리케이션입니다.

## 주요 기능

### 1. 시각 훈련 모드
- 전체화면을 좌우 2등분 (녹색/빨간색 영역)
- BPM에 맞춰 해당 영역 깜빡임
- 손/발 일러스트 표시
- 훈련 범위 선택: 왼쪽 / 오른쪽 / 양쪽

### 2. 청각 훈련 모드
- 설정된 BPM에 맞춰 "삐" 소리 재생
- 모노 사운드 지원

### 3. 설정 옵션
- **훈련 타입**: 시각 / 청각
- **신체 부위**: 손 / 발
- **훈련 범위**: 왼쪽 / 오른쪽 / 양쪽
- **BPM**: 40-200 범위 조절
- **훈련 시간**: 1-5분

### 4. 제어 기능
- 전체화면 모드
- 우측 상단 X 버튼 (프로그램 종료)
- ESC 키 (훈련 중지/취소)
- 실시간 BPM 및 남은 시간 표시

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **패키지 매니저**: npm

## 로컬 환경에서 실행

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

## 프로젝트 구조

```
timing-trainer/
├── app/
│   ├── page.tsx          # 설정 화면 (메인 페이지)
│   ├── training/
│   │   └── page.tsx      # 훈련 화면 (시각/청각 모드)
│   ├── layout.tsx        # 레이아웃
│   └── globals.css       # 글로벌 스타일
├── types/
│   └── index.ts          # TypeScript 타입 정의
├── public/               # 정적 파일
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 사용 방법

### 1. 설정 화면
1. 훈련 타입 선택 (시각 / 청각)
2. 신체 부위 선택 (손 / 발)
3. 훈련 범위 선택 (왼쪽 / 오른쪽 / 양쪽)
4. BPM 조절 (40-200)
5. 훈련 시간 설정 (1-5분)
6. "훈련 시작" 버튼 클릭

### 2. 훈련 화면
- **시각 훈련**: 화면이 BPM에 맞춰 깜빡임, 손/발 일러스트 표시
- **청각 훈련**: 소리가 BPM에 맞춰 재생
- **종료**: 우측 상단 X 버튼 클릭 또는 ESC 키 누르기
- **자동 종료**: 설정한 시간이 경과하면 자동으로 설정 화면으로 돌아감

## 특징

- 간단하고 직관적인 UI/UX
- 최소한의 리소스 사용 (저사양 PC 지원)
- 서버 연결, 로그인, 데이터베이스 불필요
- 빠른 프로토타이핑 및 검수 가능
- 크로스 플랫폼 지원 (웹 기반)

---

## 타이밍 평가 시스템

이 프로그램은 Interactive Metronome (IM) 연구를 기반으로 한 타이밍 평가 시스템을 구현하고 있습니다.

### 구현된 평가 지표

#### 1. Task Average (TA)
- **정의**: 모든 입력의 절대 편차(ms) 평균
- **계산**: `Σ|실제시간 - 예상시간| / 올바른 입력 수`
- **단위**: milliseconds (ms)
- **의미**: 낮을수록 정확한 타이밍 능력
- **구현 위치**: `utils/evaluator.ts:254-259`

#### 2. Class Level (1-7)
TA 값을 기반으로 7단계 등급 분류:

| Class | 등급명 | TA 범위 (ms) | 설명 |
|-------|--------|-------------|------|
| 7 | 최상급 | 0 - 20 | 최상급 타이밍 능력 |
| 6 | 뛰어남 | 20 - 40 | 뛰어난 타이밍 능력 |
| 5 | 평균 이상 | 40 - 80 | 평균보다 높은 타이밍 능력 |
| 4 | 평균 | 80 - 120 | 평균적인 타이밍 능력 |
| 3 | 평균 이하 | 120 - 180 | 평균보다 낮은 타이밍 능력 |
| 2 | 심각한 결핍 | 180 - 250 | 심각한 타이밍 결핍 |
| 1 | 극심한 결핍 | 250+ | 가장 심각한 타이밍 결핍 |

**구현 위치**: `types/evaluation.ts:65-115`

#### 3. Response Distribution (반응 분포)
- **Early Hit %**: 너무 빠른 반응 비율 (deviation < -5ms)
- **Late Hit %**: 너무 늦은 반응 비율 (deviation > +5ms)
- **On-Target %**: 정확한 타이밍 반응 비율 (|deviation| ≤ 5ms)
- **목표**: Early/Late 균형 (50/50에 가까울수록 개선됨)
- **구현 위치**: `utils/evaluator.ts:264-269`

#### 4. Real-time Feedback (실시간 피드백)
각 입력에 대한 즉각적인 6단계 피드백:

| 등급 | 범위 | 점수 | 색상 |
|------|------|------|------|
| Perfect | ≤15ms | 100점 | 초록색 |
| Excellent | ≤30ms | 90점 | 연두색 |
| Good | ≤50ms | 75점 | 황록색 |
| Fair | ≤80ms | 60점 | 노란색 |
| Poor | ≤120ms | 40점 | 주황색 |
| Miss | >120ms | 0점 | 빨간색 |

**구현 위치**: `types/evaluation.ts:130-167`

#### 5. 세션 통계
- **Response Rate**: 응답률 (입력한 비트 / 전체 비트)
- **Accuracy Rate**: 정확도 (올바른 입력 / 전체 입력)
- **Consistency Score**: 일관성 점수 (표준편차 기반, 0-100)
- **신체 부위별 통계**: 왼손/오른손/왼발/오른발 각각의 평균 편차 및 점수
- **구현 위치**: `utils/evaluator.ts:249-341`

### 연구 논문과의 비교

#### 연구 기준 (Chung et al., 2022)
- **대상**: 초등학생 1-3학년 (6.5-8.7세, n=8)
- **훈련**: 70+ 세션, 주 2-3회, 40-50분/세션
- **측정**: Long Form Assessment (LFA) 14개 모터 태스크

**Pre-training 결과:**
- Mean TA: 217.4 ± 59.7 ms
- Mean Class: 2.0 ± 0.8 (Severe Deficiency)
- Early Hit: 67.1 ± 13.2%
- Late Hit: 33.0 ± 13.2%

**Post-training 결과 (70+ 세션 후):**
- Mean TA: 39.1 ± 16.1 ms (82% 개선 ↓)
- Mean Class: 5.75 ± 1.0 (Above Average)
- Early Hit: 47.2 ± 8.8%
- Late Hit: 52.8 ± 8.8%

#### 현재 구현 vs 연구 논문

| 항목 | 연구 논문 | 현재 구현 | 일치 여부 |
|------|-----------|-----------|----------|
| **TA 계산 방식** | 절대 편차 평균 | 절대 편차 평균 | ✅ 일치 |
| **Deviation 계산** | actual - expected | actual - expected | ✅ 일치 |
| **Early/Late 분포** | % 계산 | % 계산 | ✅ 일치 |
| **Class 범위** | 연령별 규범 기반 | 추정 범위 사용 | ⚠️ **검토 필요** |
| **OnTarget 기준** | 명시 없음 | ±5ms | ⚠️ **추정치** |
| **피드백 단계** | 3단계 소리 | 6단계 시각 | ⚠️ **다름** |
| **피드백 범위** | 명시 없음 | 15/30/50/80/120ms | ⚠️ **추정치** |

### 현재 상태 및 향후 논의 필요 사항

#### ✅ 올바르게 구현된 부분
1. **TA 계산**: 절대 편차의 평균, 올바른 입력만 사용
2. **Deviation 방향**: 양수(늦음), 음수(빠름)
3. **Early/Late 분포**: 백분율 계산
4. **타임스탬프 기반 비트 매칭**: 가장 가까운 비트 자동 찾기 (±500ms 허용 범위)
5. **Miss 피드백**: 입력하지 않은 비트 자동 표시

#### ⚠️ 검토가 필요한 부분

##### 1. Class 범위 기준
**현재 문제:**
- 연구: TA 39.1ms → Class 5.75
- 현재: TA 39.1ms → Class 6
- 차이: Class 5/6 경계가 40ms인데, 연구 데이터와 불일치

**가능한 해결책:**
- A. 연구 데이터(2개 포인트)로 범위 역산
- B. IM 공식 매뉴얼의 정확한 Class 범위 확인
- C. 연령별 규범 테이블 구현 (6-7세, 7-8세, 성인 등)

**논의 필요:**
- 논문에 Class 1-7의 정확한 TA 범위가 명시되어 있는가?
- "연령별 규범(age-normed)"을 어떻게 구현할 것인가?

##### 2. OnTarget 기준 (±5ms)
**현재 상태:**
- Early/Late 구분: deviation < -5ms = Early, > +5ms = Late
- OnTarget 범위: |deviation| ≤ 5ms

**논의 필요:**
- 논문에 OnTarget의 정확한 범위가 명시되어 있는가?
- ±5ms가 적절한가, 아니면 ±10ms 또는 ±15ms로 조정해야 하는가?

##### 3. 실시간 피드백 시스템
**현재 상태:**
- 6단계 시각 피드백 (Perfect/Excellent/Good/Fair/Poor/Miss)
- 범위: 15/30/50/80/120ms

**연구 논문 (Stage 2):**
- 3단계 소리 피드백
  - On-target sound
  - Slightly early/late sound
  - Very early/late sound

**논의 필요:**
- 3단계 소리의 정확한 범위(ms)가 명시되어 있는가?
- 시각 모드는 6단계, 청각 모드는 3단계로 구분할 것인가?
- 현재 범위(15/30/50/80/120ms)를 조정해야 하는가?

##### 4. 14개 표준 모터 태스크
**연구 논문:**
1. Both hands
2. Right hand
3. Left hand
4. Both toes
5. Right toe
6. Left toe
7. Both heels
8. Right heel
9. Left heel
10. Right hand/Left toe
11. Left hand/Right toe
12. Right hand/Left foot (heel)
13. Left hand/Right foot (heel)
14. Balance tasks

**현재 구현:**
- 11가지 패턴 (손/발 기본 조합)
- Toe/Heel 구분 없음
- Balance 태스크 없음

**논의 필요:**
- 14개 전체 태스크 구현이 필요한가?
- Toe/Heel 입력을 어떻게 구분할 것인가? (하드웨어 요구사항)

#### 🔄 구현되지 않은 연구 요소

##### 5. 세션 추적 시스템
**연구 권장:**
- 최소 70세션
- 10세션마다 Short Form Assessment (SFA)
- Pre/Post LFA 비교

**현재 구현:**
- 개별 세션만 기록
- 세션 번호 추적 없음
- 진행도 그래프 없음

**논의 필요:**
- 세션 데이터를 어떻게 저장할 것인가? (LocalStorage / 파일 / DB)
- 진행도 그래프가 필요한가?

##### 6. 4단계 훈련 모델
**연구 프로토콜:**
- Stage 1 (1-10회): Foundation
- Stage 2 (11-30회): Auditory Processing
- Stage 3 (31-60회): Performance Optimization
- Stage 4 (61+회): Advanced Integration (dual-task)

**현재 구현:**
- 단순 반복 훈련
- 단계별 프로그램 없음

**논의 필요:**
- 4단계 모델 구현이 필요한가?
- 자동 난이도 조정 시스템이 필요한가?

##### 7. 데이터 Export
**연구 권장 형식:**
```json
{
  "assessment_date": "YYYY-MM-DD",
  "session_number": 0,
  "assessment_type": "LFA|SFA",
  "metrics": {
    "task_average_ms": 217.4,
    "class_level": 2,
    "early_hit_percent": 67.1,
    "late_hit_percent": 33.0
  }
}
```

**현재 구현:**
- 콘솔 로그만
- 파일 저장 기능 없음

**논의 필요:**
- JSON/CSV Export 기능이 필요한가?
- 클라우드 동기화가 필요한가?

### 기술 문서

상세한 구현 내용은 다음 파일 참조:
- `types/evaluation.ts`: 타입 정의 및 기준값
- `utils/evaluator.ts`: 평가 로직 구현
- `components/SessionResults.tsx`: 결과 화면
- `components/TimingFeedback.tsx`: 실시간 피드백

### 참고 문헌

연구 기반:
- Chung et al. (2022): Brain timing training effects on reading in children
- McGrew (2013): Neurophysiological mechanism of IM
- Cassily & Jacokes (2001): Test-retest reliability
- Bonacina et al. (2018), Ritter et al. (2013): Reading correlation studies

---

## 개발 단계

### Phase 1: 웹 프로토타입 (현재)
- [x] Next.js 프로젝트 설정
- [x] 설정 화면 구현
- [x] 시각 훈련 모드 구현
- [x] 청각 훈련 모드 구현
- [x] 전체화면 모드 및 제어 기능
- [ ] Vercel 배포
- [ ] 기능 검수 및 피드백 반영

### Phase 2: 데스크톱 변환 (예정)
- [ ] Electron/Tauri 패키징
- [ ] Windows 실행 파일 생성
- [ ] 저사양 PC 최적화
- [ ] 설치 프로그램 제작

### Phase 3: 고도화 (선택사항)
- [ ] 추가 기능 구현
- [ ] 사용자 피드백 반영
- [ ] 성능 최적화

## 문의 및 피드백

프로젝트에 대한 문의나 피드백은 개발자에게 직접 전달해주세요.

## 라이선스

이 프로젝트는 개인 사용을 위한 프로젝트입니다.
