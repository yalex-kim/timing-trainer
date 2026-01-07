'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSerialDevice } from '@/hooks/useSerialDevice';
import { InputDeviceMapper } from '@/config/inputMapping';

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
  const [selectedPortIndex, setSelectedPortIndex] = useState<number>(0);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testInputs, setTestInputs] = useState<string[]>([]);

  const {
    isSerialSupported,
    availablePorts,
    connectedPort,
    error,
    connectToPort,
    disconnectPort,
    requestPort,
    refreshPorts,
  } = useSerialDevice({
    autoConnect: false, // 수동 연결 모드로 변경
    onData: useCallback((char: string) => {
      if (isTestMode) {
        const inputType = InputDeviceMapper.fromSerial(char);
        if (inputType) {
          setTestInputs(prev => [...prev, `${char} → ${inputType}`].slice(-10)); // 최근 10개만 유지
        }
      }
    }, [isTestMode]),
  });

  // Serial 포트 변경 시 부모에게 알림
  useEffect(() => {
    if (connectedPort) {
      onDeviceChange('serial');
      onSerialPortChange?.(connectedPort);
    } else {
      onSerialPortChange?.(null);
    }
  }, [connectedPort, onDeviceChange, onSerialPortChange]);

  // 포트 목록 새로고침
  useEffect(() => {
    refreshPorts();
  }, []);

  const handleDeviceSelect = (device: InputDeviceType) => {
    onDeviceChange(device);
  };

  const handleAddPort = async () => {
    await requestPort();
    await refreshPorts();
  };

  const handleConnect = async () => {
    if (availablePorts.length > 0 && availablePorts[selectedPortIndex]) {
      await connectToPort(availablePorts[selectedPortIndex].port);
    }
  };

  const handleDisconnect = async () => {
    await disconnectPort();
    setIsTestMode(false);
    setTestInputs([]);
    onDeviceChange('keyboard');
  };

  const handleTestMode = () => {
    setIsTestMode(!isTestMode);
    setTestInputs([]);
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
            <div className="text-xs text-gray-600 mb-2 font-medium">Serial 장치:</div>

            {connectedPort ? (
              <div className="space-y-2">
                <div className="bg-green-50 rounded p-2 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-700 font-medium">연결됨</span>
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded"
                    >
                      연결 해제
                    </button>
                  </div>
                  {/* 연결된 포트 정보 표시 */}
                  {availablePorts.find(p => p.port === connectedPort) && (
                    <div className="text-xs text-green-600 font-mono bg-green-100 rounded px-2 py-1">
                      📡 {availablePorts.find(p => p.port === connectedPort)?.name}
                    </div>
                  )}
                </div>

                {/* 연결 테스트 버튼 */}
                <button
                  onClick={handleTestMode}
                  className={`w-full text-xs font-medium px-3 py-2 rounded transition-colors ${
                    isTestMode
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {isTestMode ? '🔴 테스트 중...' : '🧪 연결 테스트'}
                </button>

                {/* 테스트 입력 표시 */}
                {isTestMode && (
                  <div className="bg-purple-50 border border-purple-200 rounded p-2">
                    <div className="text-xs text-purple-600 font-medium mb-1">
                      테스트 입력 (최근 10개):
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {testInputs.length === 0 ? (
                        <div className="text-xs text-gray-500 italic">
                          입력 대기 중... (1, 2, 3, 4를 입력하세요)
                        </div>
                      ) : (
                        testInputs.map((input, index) => (
                          <div key={index} className="text-xs font-mono bg-white rounded px-2 py-1">
                            {input}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  입력: 1(왼손), 2(오른손), 3(왼발), 4(오른발)
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 포트 목록 */}
                {availablePorts.length > 0 ? (
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">사용 가능한 포트:</label>
                    <select
                      value={selectedPortIndex}
                      onChange={(e) => setSelectedPortIndex(Number(e.target.value))}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    >
                      {availablePorts.map((port, index) => (
                        <option key={index} value={index}>
                          {port.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic bg-gray-100 rounded p-2">
                    감지된 포트가 없습니다
                  </div>
                )}

                {/* 연결 및 장치 추가 버튼 */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleConnect}
                    disabled={availablePorts.length === 0}
                    className={`text-xs font-medium px-3 py-2 rounded transition-colors ${
                      availablePorts.length > 0
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    연결
                  </button>
                  <button
                    onClick={handleAddPort}
                    className="text-xs font-medium px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    + 장치 추가
                  </button>
                </div>

                {availablePorts.length > 0 && (
                  <div className="text-xs text-gray-500">
                    💡 포트를 선택하고 '연결' 버튼을 누르세요
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
