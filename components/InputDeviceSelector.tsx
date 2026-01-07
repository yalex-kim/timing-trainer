'use client';

import { useEffect, useState } from 'react';
import { useSerialDevice } from '@/hooks/useSerialDevice';

export type InputDeviceType = 'keyboard' | 'serial';

interface InputDeviceSelectorProps {
  selectedDevice: InputDeviceType;
  onDeviceChange: (device: InputDeviceType) => void;
  onSerialPortChange?: (port: SerialPort | null) => void;
}

export default function InputDeviceSelector({
  selectedDevice,
  onDeviceChange,
  onSerialPortChange,
}: InputDeviceSelectorProps) {
  const {
    isSerialSupported,
    availablePorts,
    connectedPort,
    error,
    requestPort,
    disconnectPort,
  } = useSerialDevice({
    autoConnect: true, // USB Serial 장치 자동 연결
  });

  // Serial 포트가 연결되면 자동으로 Serial 모드로 전환하고 부모에게 알림
  useEffect(() => {
    if (connectedPort) {
      onDeviceChange('serial');
      onSerialPortChange?.(connectedPort);
    } else {
      onSerialPortChange?.(null);
    }
  }, [connectedPort, onDeviceChange, onSerialPortChange]);

  const handleDeviceSelect = (device: InputDeviceType) => {
    onDeviceChange(device);
  };

  const handleSerialConnect = async () => {
    await requestPort();
  };

  const handleSerialDisconnect = async () => {
    await disconnectPort();
    onDeviceChange('keyboard');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          입력 장치 선택
        </label>

        {/* 입력 모드 선택 버튼 */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => handleDeviceSelect('keyboard')}
            disabled={!!connectedPort}
            className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              selectedDevice === 'keyboard' && !connectedPort
                ? 'bg-blue-500 text-white'
                : connectedPort
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span>⌨️</span>
            <span>키보드 입력</span>
          </button>
          <button
            type="button"
            onClick={() => handleDeviceSelect('serial')}
            disabled={!isSerialSupported || !connectedPort}
            className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              selectedDevice === 'serial' && connectedPort
                ? 'bg-green-500 text-white'
                : !isSerialSupported || !connectedPort
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span>🔌</span>
            <span>Serial 입력</span>
          </button>
        </div>

        {/* Serial 장치 상태 및 연결 */}
        {isSerialSupported && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-2 font-medium">Serial 장치 상태:</div>

            {connectedPort ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-green-50 rounded p-2 border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-700 font-medium">연결됨 (최우선 입력)</span>
                  </div>
                  <button
                    onClick={handleSerialDisconnect}
                    className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded"
                  >
                    연결 해제
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  입력: 1(왼손), 2(오른손), 3(왼발), 4(오른발)
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-100 rounded p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">연결 안 됨</span>
                  </div>
                  <button
                    onClick={handleSerialConnect}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    장치 연결
                  </button>
                </div>
                {availablePorts.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {availablePorts.length}개의 장치 감지됨
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                {error}
              </div>
            )}
          </div>
        )}

        {!isSerialSupported && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-700">
              ⚠️ Web Serial API가 지원되지 않는 브라우저입니다. Chrome, Edge 등을 사용해주세요.
            </p>
          </div>
        )}

        {/* 키보드 입력 가이드 */}
        {selectedDevice === 'keyboard' && !connectedPort && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-600 mb-1 font-medium">키보드 입력 매핑:</div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• E: 왼손</div>
              <div>• I: 오른손</div>
              <div>• X: 왼발</div>
              <div>• N: 오른발</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
