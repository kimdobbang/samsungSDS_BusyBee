import React, { useEffect, useRef } from 'react';

// 이미지 파일을 import로 가져오기
import startMarkerImageSrc from 'shared/assets/icons/start.png';
import endMarkerImageSrc from 'shared/assets/icons/end.png';
import currentMarkerImageSrc from 'shared/assets/icons/truck.png';

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
  currentLat?: number;
  currentLng?: number;
}

export const Map = ({
  startLat = 0,
  startLng = 0,
  endLat = 0,
  endLng = 0,
  currentLat = 36.3504,
  currentLng = 123.3845,
}: MapLocationData) => {
  // 지도와 마커를 저장할 ref
  const mapRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);
  const endMarkerRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);

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
            level: 3,
          };
          // 지도 객체 생성 및 저장 (한 번만 생성)
          mapRef.current = new window.kakao.maps.Map(container, options);

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

          // 마커 생성 및 저장 (한 번만 생성)
          startMarkerRef.current = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(startLat, startLng),
            image: startMarkerImage,
            map: mapRef.current,
          });
          endMarkerRef.current = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(endLat, endLng),
            image: endMarkerImage,
            map: mapRef.current,
          });
          currentMarkerRef.current = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(currentLat, currentLng),
            image: currentMarkerImage,
            map: mapRef.current,
          });
        } else {
          console.error('Map container not found');
        }
      });
    };
    document.head.appendChild(script);
  }, []); // 빈 배열로 한 번만 실행

  useEffect(() => {
    // 마커 위치만 업데이트
    if (
      mapRef.current &&
      startMarkerRef.current &&
      endMarkerRef.current &&
      currentMarkerRef.current
    ) {
      const newCenter = new window.kakao.maps.LatLng(currentLat, currentLng);
      mapRef.current.setCenter(newCenter);

      // 마커 위치 업데이트
      startMarkerRef.current.setPosition(new window.kakao.maps.LatLng(startLat, startLng));
      endMarkerRef.current.setPosition(new window.kakao.maps.LatLng(endLat, endLng));
      currentMarkerRef.current.setPosition(newCenter);
    }
  }, [startLat, startLng, endLat, endLng, currentLat, currentLng]); // 위치 값이 변경될 때만 실행

  return <div id='map' style={{ width: '100%', height: '100%', borderRadius: '15px' }}></div>;
};

export default Map;
