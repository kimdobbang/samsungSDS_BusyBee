// 도시코드와 위도, 경도, 이름 매핑
const locationCoordinates: Record<
  string,
  { lat: number; lng: number; name: string }
> = {
  SEL: { lat: 37.5665, lng: 126.978, name: '서울' },
  ICN: { lat: 37.4563, lng: 126.7052, name: '인천' },
  PUS: { lat: 35.1796, lng: 129.0756, name: '부산' },
  TAE: { lat: 35.8714, lng: 128.6014, name: '대구' },
  DCC: { lat: 36.3504, lng: 127.3845, name: '대전' },
  KWJ: { lat: 35.1595, lng: 126.8526, name: '광주' },
  USN: { lat: 35.5384, lng: 129.3114, name: '울산' },
  CJU: { lat: 33.4996, lng: 126.5312, name: '제주' },
  SWU: { lat: 37.2636, lng: 127.0286, name: '수원' },
  SNM: { lat: 37.42, lng: 127.1265, name: '성남' },
  CHN: { lat: 37.8813, lng: 127.7298, name: '춘천' },
  GRN: { lat: 37.7519, lng: 128.8761, name: '강릉' },
  GMP: { lat: 37.5583, lng: 126.7906, name: '김포공항' },
  CJJ: { lat: 36.7166, lng: 127.499, name: '청주공항' },
  RSU: { lat: 34.8422, lng: 127.6161, name: '여수공항' },
  KPO: { lat: 35.9878, lng: 129.4204, name: '포항공항' },
  YNY: { lat: 38.0613, lng: 128.6695, name: '양양공항' },
  WJU: { lat: 37.4412, lng: 127.96, name: '원주공항' },
  MWX: { lat: 34.9914, lng: 126.3828, name: '무안공항' },
  HIN: { lat: 35.0885, lng: 128.07, name: '사천공항' },
  SEO: { lat: 37.5547, lng: 126.9707, name: '서울역' },
  YON: { lat: 37.5296, lng: 126.9644, name: '용산역' },
  PSN: { lat: 35.1151, lng: 129.041, name: '부산역' },
  DJC: { lat: 36.332, lng: 127.4344, name: '대전역' },
  GWJ: { lat: 35.1379, lng: 126.7936, name: '광주송정역' },
  INC: { lat: 37.4766, lng: 126.6169, name: '인천역' },
  CHC: { lat: 37.8853, lng: 127.7174, name: '춘천역' },
  GRG: { lat: 37.7644, lng: 128.8961, name: '강릉역' },
  SUS: { lat: 37.4874, lng: 127.1016, name: '수서역' },
  DDG: { lat: 35.879, lng: 128.6286, name: '동대구역' },
  IKS: { lat: 35.9506, lng: 126.9574, name: '익산역' },
  JJR: { lat: 35.8242, lng: 127.148, name: '전주역' },
  MKP: { lat: 34.8118, lng: 126.3922, name: '목포역' },
  YSR: { lat: 34.7424, lng: 127.7371, name: '여수엑스포역' },
  POH: { lat: 36.0101, lng: 129.345, name: '포항역' },
  BPH: { lat: 35.1046, lng: 129.0359, name: '부산항' },
  IPH: { lat: 37.4489, lng: 126.6005, name: '인천항' },
  UPH: { lat: 35.5013, lng: 129.3915, name: '울산항' },
  PTH: { lat: 36.9781, lng: 126.832, name: '평택항' },
  YHP: { lat: 34.7365, lng: 127.745, name: '여수항' },
  MHP: { lat: 34.782, lng: 126.376, name: '목포항' },
  PHP: { lat: 36.0325, lng: 129.365, name: '포항항' },
  JPH: { lat: 33.5178, lng: 126.5261, name: '제주항' },
  GPH: { lat: 34.9164, lng: 127.6955, name: '광양항' },
  SCH: { lat: 34.926, lng: 128.064, name: '삼천포항' },
  DHH: { lat: 37.4924, lng: 129.127, name: '동해항' },
  MSH: { lat: 35.204, lng: 128.572, name: '마산항' },
  JHH: { lat: 35.152, lng: 128.702, name: '진해항' },
  GSH: { lat: 35.978, lng: 126.667, name: '군산항' },
  SSH: { lat: 36.785, lng: 126.45, name: '서산항' },
  TAH: { lat: 36.75, lng: 126.2978, name: '태안항' },
  ULH: { lat: 37.484, lng: 130.905, name: '울릉항' },
  DDH: { lat: 37.239, lng: 131.865, name: '독도항' },
  CFT: { lat: 37.5569, lng: 126.8039, name: '화물터미널' },
  ILB: { lat: 37.457, lng: 126.71, name: '국제물류기지' },
  NHN: { lat: 34.8373, lng: 128.0599, name: '남해항' },
  GJH: { lat: 34.8803, lng: 128.6215, name: '거제항' },
  SHA: { lat: 31.2304, lng: 121.4737, name: '상하이항' },
  HKG: { lat: 22.3193, lng: 114.1694, name: '홍콩항' },
  SIN: { lat: 1.3521, lng: 103.8198, name: '싱가포르항' },
  TYO: { lat: 35.6895, lng: 139.6917, name: '도쿄항' },
  NYH: { lat: 40.7128, lng: -74.006, name: '뉴욕항' },
  LAH: { lat: 34.0522, lng: -118.2437, name: '로스앤젤레스항' },
  LDH: { lat: 51.5074, lng: -0.1278, name: '런던항' },
  HAM: { lat: 53.5511, lng: 9.9937, name: '함부르크항' },
  DXB: { lat: 25.276987, lng: 55.296249, name: '두바이항' },
};

export function getCoordinatesByCode(code: string) {
  const coordinates = locationCoordinates[code];
  if (coordinates) {
    return coordinates;
  } else {
    // console.error('Invalid code or coordinates not found.');
    return null;
  }
}

export function getCityNameByCode(code: string) {
  const cityName = locationCoordinates[code]?.name;
  if (cityName) {
    return cityName;
  } else {
    console.error('Invalid code or city name not found.');
    return 'unknown';
  }
}
// // 사용 예제
// const code = 'SEL';
// const coordinates = getCoordinatesByCode(code);
// if (coordinates) {
//   console.log(`위도: ${coordinates.lat}, 경도: ${coordinates.lon}`);
// } else {
//   console.log('Coordinates not found.');
// }
