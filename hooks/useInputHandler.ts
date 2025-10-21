/**
 * Custom Hook for Handling Multiple Input Sources
 * Supports: Keyboard, USB HID, MIDI, Gamepad
 */

import { useEffect, useCallback, useRef } from 'react';
import { InputType, InputEvent } from '@/types/evaluation';
import { InputMapper } from '@/utils/evaluator';

interface UseInputHandlerProps {
  onInput: (inputEvent: InputEvent) => void;
  enableKeyboard?: boolean;
  enableMIDI?: boolean;
  enableHID?: boolean;
  enableGamepad?: boolean;
}

export function useInputHandler({
  onInput,
  enableKeyboard = true,
  enableMIDI = false,
  enableHID = false,
  enableGamepad = false,
}: UseInputHandlerProps) {
  const startTimeRef = useRef<number>(0);
  const midiAccessRef = useRef<any>(null);
  const hidDeviceRef = useRef<any>(null);
  const gamepadIntervalRef = useRef<number | null>(null);
  const lastGamepadStateRef = useRef<Map<number, boolean>>(new Map());

  // 세션 시작 시간 설정
  useEffect(() => {
    startTimeRef.current = performance.now();
  }, []);

  // ============================================================================
  // 키보드 입력 처리
  // ============================================================================

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 중복 입력 방지
      if (event.repeat) return;

      const inputType = InputMapper.keyToInputType(event.key);
      if (!inputType) return;

      const inputEvent: InputEvent = {
        type: inputType,
        timestamp: performance.now() - startTimeRef.current,
        source: 'keyboard',
        rawData: { key: event.key, code: event.code },
      };

      onInput(inputEvent);
    },
    [onInput]
  );

  useEffect(() => {
    if (!enableKeyboard) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboard, handleKeyDown]);

  // ============================================================================
  // MIDI 입력 처리
  // ============================================================================

  useEffect(() => {
    if (!enableMIDI) return;

    const setupMIDI = async () => {
      try {
        // @ts-ignore - Web MIDI API
        if (!navigator.requestMIDIAccess) {
          console.warn('Web MIDI API not supported');
          return;
        }

        // @ts-ignore
        const midiAccess = await navigator.requestMIDIAccess();
        midiAccessRef.current = midiAccess;

        // 모든 MIDI 입력 장치에 리스너 등록
        midiAccess.inputs.forEach((input: any) => {
          console.log('MIDI Input connected:', input.name);
          input.onmidimessage = (message: any) => {
            const [status, note, velocity] = message.data;

            // Note On 메시지만 처리 (144-159)
            if (status >= 144 && status <= 159 && velocity > 0) {
              const inputType = InputMapper.midiNoteToInputType(note);
              if (!inputType) return;

              const inputEvent: InputEvent = {
                type: inputType,
                timestamp: performance.now() - startTimeRef.current,
                source: 'midi',
                rawData: { note, velocity, status },
              };

              onInput(inputEvent);
            }
          };
        });
      } catch (error) {
        console.error('Failed to setup MIDI:', error);
      }
    };

    setupMIDI();

    return () => {
      if (midiAccessRef.current) {
        midiAccessRef.current.inputs.forEach((input: any) => {
          input.onmidimessage = null;
        });
      }
    };
  }, [enableMIDI, onInput]);

  // ============================================================================
  // USB HID 입력 처리
  // ============================================================================

  useEffect(() => {
    if (!enableHID) return;

    const setupHID = async () => {
      try {
        // @ts-ignore - Web HID API
        if (!navigator.hid) {
          console.warn('Web HID API not supported');
          return;
        }

        // 사용자에게 HID 디바이스 선택 요청
        // @ts-ignore
        const devices = await navigator.hid.requestDevice({
          filters: [
            { usagePage: 0x01, usage: 0x05 }, // Gamepad
            { usagePage: 0x01, usage: 0x06 }, // Keyboard
            { usagePage: 0x01, usage: 0x04 }, // Joystick
          ],
        });

        if (devices.length === 0) return;

        const device = devices[0];
        await device.open();
        hidDeviceRef.current = device;

        console.log('HID Device connected:', device.productName);

        device.addEventListener('inputreport', (event: any) => {
          const { data, reportId } = event;

          // 버튼 데이터 파싱 (디바이스마다 다를 수 있음)
          // 예시: 첫 번째 바이트가 버튼 상태
          const buttonByte = data.getUint8(0);

          // 각 비트가 버튼을 나타낸다고 가정
          for (let i = 0; i < 8; i++) {
            if (buttonByte & (1 << i)) {
              const inputType = InputMapper.hidButtonToInputType(i);
              if (!inputType) continue;

              const inputEvent: InputEvent = {
                type: inputType,
                timestamp: performance.now() - startTimeRef.current,
                source: 'usb',
                rawData: { buttonByte, buttonIndex: i, reportId },
              };

              onInput(inputEvent);
            }
          }
        });
      } catch (error) {
        console.error('Failed to setup HID:', error);
      }
    };

    setupHID();

    return () => {
      if (hidDeviceRef.current) {
        hidDeviceRef.current.close();
      }
    };
  }, [enableHID, onInput]);

  // ============================================================================
  // Gamepad 입력 처리
  // ============================================================================

  useEffect(() => {
    if (!enableGamepad) return;

    const pollGamepads = () => {
      const gamepads = navigator.getGamepads();

      for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (!gamepad) continue;

        // 각 버튼 상태 확인
        gamepad.buttons.forEach((button, buttonIndex) => {
          const wasPressed = lastGamepadStateRef.current.get(buttonIndex) || false;
          const isPressed = button.pressed;

          // 버튼이 눌렸을 때만 (상승 에지)
          if (isPressed && !wasPressed) {
            const inputType = InputMapper.gamepadButtonToInputType(buttonIndex);
            if (!inputType) return;

            const inputEvent: InputEvent = {
              type: inputType,
              timestamp: performance.now() - startTimeRef.current,
              source: 'gamepad',
              rawData: { buttonIndex, value: button.value },
            };

            onInput(inputEvent);
          }

          lastGamepadStateRef.current.set(buttonIndex, isPressed);
        });
      }
    };

    // 60Hz로 폴링
    gamepadIntervalRef.current = window.setInterval(pollGamepads, 16);

    // Gamepad 연결 이벤트
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad.id);
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    return () => {
      if (gamepadIntervalRef.current) {
        clearInterval(gamepadIntervalRef.current);
      }
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, [enableGamepad, onInput]);

  return null;
}
