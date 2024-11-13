import React, { useEffect } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapProps {
  latitude: number;
  longitude: number;
}

export const Map: React.FC<MapProps> = ({ latitude, longitude }) => {
  useEffect(() => {
    // 카카오맵 API 스크립트 동적으로 추가
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      // 카카오맵 API 초기화
      window.kakao.maps.load(() => {
        const container = document.getElementById('map'); // 지도를 표시할 컨테이너
        const options = {
          center: new window.kakao.maps.LatLng(latitude, longitude), // 지도의 중심 좌표
          level: 3, // 지도의 확대 레벨
        };
        // 지도 생성
        const map = new window.kakao.maps.Map(container, options);
      });
    };
    document.head.appendChild(script);
  }, [latitude, longitude]);

  return <div id='map' style={{ width: '100%', height: '100%', borderRadius: '15px' }}></div>;
};

export default Map;
