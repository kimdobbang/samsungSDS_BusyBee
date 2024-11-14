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

interface MapLocationData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  currentLat: number;
  currentLng: number;
}

export const Map = ({
  startLat = 0,
  startLng = 0,
  endLat = 0,
  endLng = 0,
  currentLat = 0,
  currentLng = 0,
}: MapLocationData) => {
  useEffect(() => {
    // 카카오맵 API 스크립트 동적으로 추가
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        if (container) {
          const options = {
            center: new window.kakao.maps.LatLng(currentLat, currentLng),
            level: 13,
          };
          const map = new window.kakao.maps.Map(container, options);

          // 마커 변수 선언
          // 마커 변수 선언 (타입 명시)
          let startMarker: any = null;
          let endMarker: any = null;
          let currentMarker: any = null;

          // 마커 생성 함수
          const createMarkers = () => {
            // 마커 위치 설정
            const startMarkerPosition = new window.kakao.maps.LatLng(startLat, startLng);
            const endMarkerPosition = new window.kakao.maps.LatLng(endLat, endLng);
            const currentMarkerPosition = new window.kakao.maps.LatLng(currentLat, currentLng);

            // 마커 이미지 설정
            const startMarkerImage = new window.kakao.maps.MarkerImage(
              startMarkerImageSrc,
              new window.kakao.maps.Size(28, 28)
            );
            const endMarkerImage = new window.kakao.maps.MarkerImage(
              endMarkerImageSrc,
              new window.kakao.maps.Size(28, 28)
            );
            const currentMarkerImage = new window.kakao.maps.MarkerImage(
              currentMarkerImageSrc,
              new window.kakao.maps.Size(28, 28)
            );

            // 기존 마커 제거
            if (startMarker) startMarker.setMap(null);
            if (endMarker) endMarker.setMap(null);
            if (currentMarker) currentMarker.setMap(null);

            // 마커 생성 및 지도에 표시
            startMarker = new window.kakao.maps.Marker({
              position: startMarkerPosition,
              image: startMarkerImage,
            });
            startMarker.setMap(map);

            endMarker = new window.kakao.maps.Marker({
              position: endMarkerPosition,
              image: endMarkerImage,
            });
            endMarker.setMap(map);

            currentMarker = new window.kakao.maps.Marker({
              position: currentMarkerPosition,
              image: currentMarkerImage,
            });
            currentMarker.setMap(map);
          };

          // 초기 마커 생성
          createMarkers();

          // 마커 위치가 변경될 때마다 업데이트
          const updateMarkers = () => {
            map.setCenter(new window.kakao.maps.LatLng(currentLat, currentLng));
            createMarkers();
          };

          // 마커 위치 업데이트 함수 실행
          updateMarkers();
        } else {
          console.error('Map container not found');
        }
      });
    };
    document.head.appendChild(script);
  }, [startLat, startLng, endLat, endLng, currentLat, currentLng]); // 의존성 배열에 위치 값을 추가

  return <div id='map' style={{ width: '100%', height: '100%', borderRadius: '15px' }}></div>;
};

export default Map;
