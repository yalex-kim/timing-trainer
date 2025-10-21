/**
 * Input Device Mapping Configuration
 * 입력 장치 매핑 설정 - 이 파일만 수정하면 모든 입력 매핑이 변경됩니다
 */

import { InputType } from '@/types/evaluation';

// ============================================================================
// 키보드 매핑 설정
// ============================================================================

export const KEYBOARD_MAPPING: Record<string, InputType> = {
  // 왼손
  'e': 'left-hand',
  'E': 'left-hand',

  // 오른손
  'i': 'right-hand',
  'I': 'right-hand',

  // 왼발
  'x': 'left-foot',
  'X': 'left-foot',

  // 오른발
  'n': 'right-foot',
  'N': 'right-foot',
};

// 키 표시용 레이블
export const KEYBOARD_LABELS: Record<InputType, string> = {
  'left-hand': 'E',
  'right-hand': 'I',
  'left-foot': 'X',
  'right-foot': 'N',
};

// ============================================================================
// MIDI 매핑 설정
// ============================================================================

export const MIDI_NOTE_MAPPING: Record<number, InputType> = {
  60: 'left-hand',   // C4
  62: 'right-hand',  // D4
  64: 'left-foot',   // E4
  65: 'right-foot',  // F4
};

// MIDI 노트 표시용 레이블
export const MIDI_NOTE_LABELS: Record<InputType, string> = {
  'left-hand': 'C4 (60)',
  'right-hand': 'D4 (62)',
  'left-foot': 'E4 (64)',
  'right-foot': 'F4 (65)',
};

// ============================================================================
// USB HID 매핑 설정
// ============================================================================

export const HID_BUTTON_MAPPING: Record<number, InputType> = {
  0: 'left-hand',
  1: 'right-hand',
  2: 'left-foot',
  3: 'right-foot',
};

// USB HID 버튼 표시용 레이블
export const HID_BUTTON_LABELS: Record<InputType, string> = {
  'left-hand': 'Button 1',
  'right-hand': 'Button 2',
  'left-foot': 'Button 3',
  'right-foot': 'Button 4',
};

// ============================================================================
// Gamepad 매핑 설정
// ============================================================================

export const GAMEPAD_BUTTON_MAPPING: Record<number, InputType> = {
  0: 'left-hand',   // A 버튼
  1: 'right-hand',  // B 버튼
  2: 'left-foot',   // X 버튼
  3: 'right-foot',  // Y 버튼
};

// Gamepad 버튼 표시용 레이블
export const GAMEPAD_BUTTON_LABELS: Record<InputType, string> = {
  'left-hand': 'A Button',
  'right-hand': 'B Button',
  'left-foot': 'X Button',
  'right-foot': 'Y Button',
};

// ============================================================================
// 통합 매핑 함수
// ============================================================================

export class InputDeviceMapper {
  /**
   * 키보드 키를 InputType으로 변환
   */
  static fromKeyboard(key: string): InputType | null {
    return KEYBOARD_MAPPING[key] || null;
  }

  /**
   * MIDI 노트를 InputType으로 변환
   */
  static fromMIDI(note: number): InputType | null {
    return MIDI_NOTE_MAPPING[note] || null;
  }

  /**
   * USB HID 버튼을 InputType으로 변환
   */
  static fromHID(buttonId: number): InputType | null {
    return HID_BUTTON_MAPPING[buttonId] || null;
  }

  /**
   * Gamepad 버튼을 InputType으로 변환
   */
  static fromGamepad(buttonIndex: number): InputType | null {
    return GAMEPAD_BUTTON_MAPPING[buttonIndex] || null;
  }

  /**
   * InputType에 대한 키보드 레이블 가져오기
   */
  static getKeyboardLabel(inputType: InputType): string {
    return KEYBOARD_LABELS[inputType];
  }

  /**
   * InputType에 대한 MIDI 레이블 가져오기
   */
  static getMIDILabel(inputType: InputType): string {
    return MIDI_NOTE_LABELS[inputType];
  }

  /**
   * InputType에 대한 HID 레이블 가져오기
   */
  static getHIDLabel(inputType: InputType): string {
    return HID_BUTTON_LABELS[inputType];
  }

  /**
   * InputType에 대한 Gamepad 레이블 가져오기
   */
  static getGamepadLabel(inputType: InputType): string {
    return GAMEPAD_BUTTON_LABELS[inputType];
  }
}

// ============================================================================
// 설정 유효성 검사
// ============================================================================

/**
 * 모든 InputType이 최소 하나의 키에 매핑되어 있는지 확인
 */
export function validateInputMapping(): {
  isValid: boolean;
  missing: InputType[];
} {
  const requiredTypes: InputType[] = ['left-hand', 'right-hand', 'left-foot', 'right-foot'];
  const mappedTypes = new Set(Object.values(KEYBOARD_MAPPING));
  const missing = requiredTypes.filter(type => !mappedTypes.has(type));

  return {
    isValid: missing.length === 0,
    missing,
  };
}

// 초기화 시 검증
const validation = validateInputMapping();
if (!validation.isValid) {
  console.warn(
    '⚠️ 입력 매핑이 불완전합니다. 다음 입력 타입에 대한 키 매핑이 없습니다:',
    validation.missing
  );
}
