/**
 * Custom Hook for Web Serial API
 * USB Serial 장치 자동 감지 및 연결 관리
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface SerialDeviceInfo {
  port: SerialPort;
  name: string;
  isConnected: boolean;
}

interface UseSerialDeviceProps {
  onData?: (data: string) => void;
  autoConnect?: boolean;
}

export function useSerialDevice({ onData, autoConnect = false }: UseSerialDeviceProps = {}) {
  const [availablePorts, setAvailablePorts] = useState<SerialDeviceInfo[]>([]);
  const [connectedPort, setConnectedPort] = useState<SerialPort | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const isReadingRef = useRef(false);

  // Web Serial API 지원 확인
  const isSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  // 사용 가능한 포트 목록 가져오기
  const refreshPorts = useCallback(async () => {
    if (!isSerialSupported) {
      setError('Web Serial API가 지원되지 않는 브라우저입니다.');
      return;
    }

    try {
      const ports = await navigator.serial.getPorts();
      const portInfos: SerialDeviceInfo[] = await Promise.all(
        ports.map(async (port) => {
          const info = port.getInfo();
          return {
            port,
            name: `USB Serial (VID: ${info.usbVendorId?.toString(16)}, PID: ${info.usbProductId?.toString(16)})`,
            isConnected: port.readable !== null,
          };
        })
      );
      setAvailablePorts(portInfos);

      // 자동 연결 모드이고 연결되지 않은 포트가 있으면 첫 번째 포트에 자동 연결
      if (autoConnect && portInfos.length > 0 && !connectedPort) {
        await connectToPort(portInfos[0].port);
      }
    } catch (err) {
      console.error('Failed to get serial ports:', err);
      setError('포트 목록을 가져오는 데 실패했습니다.');
    }
  }, [isSerialSupported, autoConnect, connectedPort]);

  // 포트 연결
  const connectToPort = useCallback(async (port: SerialPort) => {
    try {
      // 이미 열려있으면 닫기
      if (port.readable) {
        await disconnectPort();
      }

      await port.open({ baudRate: 9600 });
      setConnectedPort(port);
      setError(null);
      console.log('Serial port connected');

      // 읽기 시작
      if (port.readable && onData) {
        setIsReading(true);
        isReadingRef.current = true;

        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();
        readerRef.current = reader;

        // 데이터 읽기 루프
        (async () => {
          try {
            while (isReadingRef.current) {
              const { value, done } = await reader.read();
              if (done || !isReadingRef.current) {
                break;
              }
              if (value) {
                // 받은 데이터를 한 문자씩 처리
                for (const char of value) {
                  onData(char);
                }
              }
            }
          } catch (error) {
            console.error('Error reading from serial port:', error);
            setError('데이터 읽기 중 오류가 발생했습니다.');
          } finally {
            reader.releaseLock();
          }
        })();
      }
    } catch (err) {
      console.error('Failed to connect to serial port:', err);
      setError('포트 연결에 실패했습니다.');
    }
  }, [onData]);

  // 포트 연결 해제
  const disconnectPort = useCallback(async () => {
    if (!connectedPort) return;

    try {
      // 읽기 중지
      isReadingRef.current = false;
      setIsReading(false);

      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }

      // 포트 닫기
      if (connectedPort.readable) {
        await connectedPort.close();
      }

      setConnectedPort(null);
      console.log('Serial port disconnected');
    } catch (err) {
      console.error('Failed to disconnect serial port:', err);
      setError('포트 연결 해제에 실패했습니다.');
    }
  }, [connectedPort]);

  // 포트 선택 요청 (사용자가 수동으로 선택)
  const requestPort = useCallback(async () => {
    if (!isSerialSupported) {
      setError('Web Serial API가 지원되지 않는 브라우저입니다.');
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await connectToPort(port);
      await refreshPorts();
    } catch (err) {
      console.error('Failed to request serial port:', err);
      if ((err as Error).name !== 'NotFoundError') {
        setError('포트 선택에 실패했습니다.');
      }
    }
  }, [isSerialSupported, connectToPort, refreshPorts]);

  // Serial 포트 연결/해제 이벤트 리스닝
  useEffect(() => {
    if (!isSerialSupported) return;

    const handleConnect = () => {
      console.log('Serial device connected');
      refreshPorts();
    };

    const handleDisconnect = () => {
      console.log('Serial device disconnected');
      setConnectedPort(null);
      refreshPorts();
    };

    navigator.serial.addEventListener('connect', handleConnect);
    navigator.serial.addEventListener('disconnect', handleDisconnect);

    // 초기 포트 목록 가져오기
    refreshPorts();

    return () => {
      navigator.serial.removeEventListener('connect', handleConnect);
      navigator.serial.removeEventListener('disconnect', handleDisconnect);

      // 컴포넌트 언마운트 시 연결 해제
      if (connectedPort) {
        disconnectPort();
      }
    };
  }, [isSerialSupported, refreshPorts]);

  return {
    isSerialSupported,
    availablePorts,
    connectedPort,
    isReading,
    error,
    connectToPort,
    disconnectPort,
    requestPort,
    refreshPorts,
  };
}
