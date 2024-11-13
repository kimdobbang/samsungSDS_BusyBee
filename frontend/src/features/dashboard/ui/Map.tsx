import React, { useEffect } from 'react';

// 이미지 파일을 import로 가져오기
import startMarkerImageSrc from 'shared/assets/icons/start.png';
import endMarkerImageSrc from 'shared/assets/icons/end.png';
import currentMarkerImageSrc from 'shared/assets/icons/car.png';

declare global {
  interface Window {
    kakao: any;
  }
}

// 공통 인터페이스 정의
interface LocationProps {
  latitude: number;
  longitude: number;
}

export const Map: React.FC = () => {
  useEffect(() => {
    // 위치 설정
    const startPoint: LocationProps = {
      latitude: 37.5665,
      longitude: 126.978,
    };
    const endPoint: LocationProps = {
      latitude: 37.57,
      longitude: 126.982,
    };
    const currentPoint: LocationProps = {
      latitude: 37.5651,
      longitude: 126.99,
    };

    // 카카오맵 API 스크립트 동적으로 추가
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        if (container) {
          const options = {
            center: new window.kakao.maps.LatLng(startPoint.latitude, startPoint.longitude),
            level: 3,
          };
          const map = new window.kakao.maps.Map(container, options);

          // 마커 위치 설정
          const startMarkerPosition = new window.kakao.maps.LatLng(
            startPoint.latitude,
            startPoint.longitude
          );
          const endMarkerPosition = new window.kakao.maps.LatLng(
            endPoint.latitude,
            endPoint.longitude
          );
          const currentMarkerPosition = new window.kakao.maps.LatLng(
            currentPoint.latitude,
            currentPoint.longitude
          );

          // 마커 이미지 설정
          const startMarkerImage = new window.kakao.maps.MarkerImage(
            startMarkerImageSrc,
            new window.kakao.maps.Size(28, 28) // 마커 이미지 크기 설정
          );
          const endMarkerImage = new window.kakao.maps.MarkerImage(
            endMarkerImageSrc,
            new window.kakao.maps.Size(28, 28)
          );
          const currentMarkerImage = new window.kakao.maps.MarkerImage(
            currentMarkerImageSrc,
            new window.kakao.maps.Size(28, 28)
          );

          // 마커 생성 및 지도에 표시
          const startMarker = new window.kakao.maps.Marker({
            position: startMarkerPosition,
            image: startMarkerImage,
          });
          startMarker.setMap(map);

          const endMarker = new window.kakao.maps.Marker({
            position: endMarkerPosition,
            image: endMarkerImage,
          });
          endMarker.setMap(map);

          const currentMarker = new window.kakao.maps.Marker({
            position: currentMarkerPosition,
            image: currentMarkerImage,
          });
          currentMarker.setMap(map);

          console.log('Marker created:', startMarker, endMarker, currentMarker);
        } else {
          console.error('Map container not found');
        }
      });
    };
    document.head.appendChild(script);
  }, []);

  return <div id='map' style={{ width: '100%', height: '100%', borderRadius: '15px' }}></div>;
};

export default Map;
