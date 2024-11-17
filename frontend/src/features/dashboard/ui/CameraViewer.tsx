import React, { useState, useEffect } from 'react';

export const CameraViewer: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    // WebSocket 연결 설정
    const ws = new WebSocket('ws://218.150.140.4:8081');

    ws.onopen = () => {
      console.log('WebSocket connection established. 카메라 연결');
      setIsConnected(true); // 연결 성공
    };

    ws.onmessage = (event) => {
      // WebSocket으로 받은 이미지 데이터를 base64로 설정
      setImageSrc(`data:image/jpeg;base64,${event.data}`);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
      setIsConnected(false); // 연결 종료
    };

    // 컴포넌트 언마운트 시 WebSocket 연결 해제
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        backgroundColor: '#000',
        borderRadius: '15px',
      }}
    >
      {isConnected && imageSrc ? (
        <img
          src={imageSrc}
          alt='ESP32 Live Feed'
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            border: '1px solid #ddd',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }}
        />
      ) : (
        <div style={{ color: 'white', fontSize: '18px' }}>카메라 웹소켓 연결에 실패했습니다.</div>
      )}
    </div>
  );
};

export default CameraViewer;
