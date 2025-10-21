# 입력 설정 가이드 (Input Configuration Guide)

## 🎹 현재 키보드 매핑

### 기본 키 설정

| 신체 부위 | 키 | 설명 |
|----------|-----|------|
| 👈 **왼손** | `E` | Left Hand |
| 👉 **오른손** | `I` | Right Hand |
| 🦵 **왼발** | `X` | Left Foot |
| 🦵 **오른발** | `N` | Right Foot |

### 키보드 레이아웃 시각화

```
        E           I
      (왼손)      (오른손)


        X           N
      (왼발)      (오른발)
```

---

## 🔧 키 매핑 변경 방법

### 옵션 1: 설정 파일 직접 수정 (개발자용)

**파일 위치**: `config/inputMapping.ts`

```typescript
export const KEYBOARD_MAPPING: Record<string, InputType> = {
  // 왼손 - 원하는 키로 변경
  'e': 'left-hand',
  'E': 'left-hand',

  // 오른손 - 원하는 키로 변경
  'i': 'right-hand',
  'I': 'right-hand',

  // 왼발 - 원하는 키로 변경
  'x': 'left-foot',
  'X': 'left-foot',

  // 오른발 - 원하는 키로 변경
  'n': 'right-foot',
  'N': 'right-foot',
};
```

**키 레이블도 업데이트**:
```typescript
export const KEYBOARD_LABELS: Record<InputType, string> = {
  'left-hand': 'E',    // UI에 표시될 레이블
  'right-hand': 'I',
  'left-foot': 'X',
  'right-foot': 'N',
};
```

### 옵션 2: 여러 키 할당하기

하나의 신체 부위에 여러 키를 할당할 수 있습니다:

```typescript
export const KEYBOARD_MAPPING: Record<string, InputType> = {
  // 왼손 - 여러 키 지원
  'e': 'left-hand',
  'E': 'left-hand',
  'q': 'left-hand',  // Q도 왼손으로 인식
  'Q': 'left-hand',

  // 오른손
  'i': 'right-hand',
  'I': 'right-hand',
  'p': 'right-hand', // P도 오른손으로 인식
  'P': 'right-hand',

  // ... 나머지 동일
};
```

---

## 🎮 다른 입력 장치 설정

### MIDI 디바이스 (전자 드럼, MIDI 키보드 등)

**파일 위치**: `config/inputMapping.ts`

```typescript
export const MIDI_NOTE_MAPPING: Record<number, InputType> = {
  60: 'left-hand',   // C4
  62: 'right-hand',  // D4
  64: 'left-foot',   // E4
  65: 'right-foot',  // F4
};
```

**MIDI 노트 번호 찾기**:
1. 브라우저 콘솔을 엽니다 (F12)
2. MIDI 디바이스를 누릅니다
3. 콘솔에 노트 번호가 표시됩니다
4. 해당 번호를 위 매핑에 추가합니다

### USB HID 디바이스 (페달, 버튼 등)

```typescript
export const HID_BUTTON_MAPPING: Record<number, InputType> = {
  0: 'left-hand',   // 첫 번째 버튼
  1: 'right-hand',  // 두 번째 버튼
  2: 'left-foot',   // 세 번째 버튼
  3: 'right-foot',  // 네 번째 버튼
};
```

### Gamepad (게임 컨트롤러)

```typescript
export const GAMEPAD_BUTTON_MAPPING: Record<number, InputType> = {
  0: 'left-hand',   // A 버튼
  1: 'right-hand',  // B 버튼
  2: 'left-foot',   // X 버튼
  3: 'right-foot',  // Y 버튼
};
```

---

## 🚀 입력 장치 활성화

### 훈련 화면에서 활성화

```typescript
// app/training/page.tsx

useInputHandler({
  onInput: handleInput,
  enableKeyboard: true,   // 키보드 활성화
  enableMIDI: false,      // MIDI 비활성화
  enableHID: false,       // USB HID 비활성화
  enableGamepad: false,   // Gamepad 비활성화
});
```

### 여러 입력 장치 동시 사용

```typescript
useInputHandler({
  onInput: handleInput,
  enableKeyboard: true,   // 키보드 + MIDI 동시 사용
  enableMIDI: true,
});
```

---

## 📋 입력 설정 검증

프로젝트를 실행하면 자동으로 입력 매핑을 검증합니다:

```
✅ 모든 입력 타입이 매핑되었습니다.
```

또는

```
⚠️ 입력 매핑이 불완전합니다. 다음 입력 타입에 대한 키 매핑이 없습니다:
  - left-hand
  - right-foot
```

---

## 💡 권장 키 설정

### 양손 훈련

- **왼손**: `F` (검지 위치)
- **오른손**: `J` (검지 위치)

### 양발 훈련

- **왼발**: `Z` (왼쪽 하단)
- **오른발**: `/` (오른쪽 하단)

### 손발 혼합 훈련

- **왼손**: `E`
- **오른손**: `I`
- **왼발**: `X`
- **오른발**: `N`

### 게이머 레이아웃

- **왼손**: `A`
- **오른손**: `D`
- **왼발**: `S`
- **오른발**: `W`

---

## 🔄 변경사항 적용

1. `config/inputMapping.ts` 파일 수정
2. 개발 서버 재시작: `npm run dev`
3. 브라우저 새로고침
4. 입력 가이드에서 새 키 확인

---

## 🧪 입력 테스트

### 테스트 방법

1. 훈련 화면으로 이동
2. 화면 하단의 "다음 입력" 가이드 확인
3. 표시된 키를 누름
4. 피드백 확인 (PERFECT, GOOD 등)

### 문제 해결

**입력이 인식되지 않는 경우**:
1. 브라우저 콘솔 확인 (F12)
2. `KEYBOARD_MAPPING`에 키가 추가되었는지 확인
3. 대소문자 모두 추가했는지 확인

**잘못된 입력으로 표시되는 경우**:
1. 예상 입력과 실제 입력이 일치하는지 확인
2. 훈련 패턴 확인 (왼손/오른손/교대 등)

---

## 📱 모바일 지원 (향후 추가 예정)

- 터치 버튼
- 스와이프 제스처
- 기울임 센서 (선택사항)

---

## 🎯 고급 설정

### 입력 지연 보정

미세한 입력 지연이 있는 경우, 타임스탬프를 조정할 수 있습니다:

```typescript
// hooks/useInputHandler.ts 수정

const inputEvent: InputEvent = {
  type: inputType,
  timestamp: performance.now() - startTimeRef.current - 10, // 10ms 보정
  source: 'keyboard',
  rawData: { key: event.key, code: event.code },
};
```

### 커스텀 입력 소스 추가

새로운 입력 장치를 추가하려면:

1. `config/inputMapping.ts`에 매핑 추가
2. `hooks/useInputHandler.ts`에 핸들러 추가
3. `InputDeviceMapper`에 변환 함수 추가

---

## 📞 지원

입력 설정에 문제가 있으면:
1. `config/inputMapping.ts` 파일 확인
2. 브라우저 콘솔 확인
3. 개발 서버 재시작

---

**마지막 업데이트**: 2025-10-21
**버전**: 1.0.0
