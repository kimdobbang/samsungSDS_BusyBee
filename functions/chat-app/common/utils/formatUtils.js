// formatUtils

function formatDateTimestamp(timestamp) {
  if (!timestamp || isNaN(new Date(timestamp).getTime())) {
    return '지난 대화';
  }
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}
// Helper: 기본값이 아닌 값 확인
function isNotDefaultValue(value) {
  return value !== null && value !== undefined && value !== 'omission';
}

// Helper: 날짜 형식 검증
function isValidDateFormat(value) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // ISO 8601 형식 (YYYY-MM-DD)
  return dateRegex.test(value);
}
// 필드명과 한국어 매핑
const fieldTranslation = {
  Weight: '중량 (kg)',
  ContainerSize: '컨테이너 크기',
  DepartureDate: '출발 날짜',
  ArrivalDate: '도착 날짜',
  DepartureCity: '출발 도시',
  ArrivalCity: '도착 도시',
};

// 컨테이너 크기 매핑
const containerSizeMapping = {
  1: '20ft',
  2: '40ft',
  3: '40ft HC',
  4: '45ft',
};

// 필드값 변환
function formatFieldValue(key, value) {
  if (key === 'Weight') {
    return `${value}kg`; // 중량에 단위 추가
  }
  if (key === 'ContainerSize' && containerSizeMapping[value]) {
    return containerSizeMapping[value]; // 컨테이너 크기 변환
  }
  return value; // 다른 값은 그대로 반환
}

// 누락된 필드를 자연스럽게 설명하는 메시지 생성
function generateMissingFieldsMessage(pendingFields) {
  const missingFields = Object.entries(pendingFields)
    .filter(([_, value]) => value === 'omission' || value === 'unknown')
    .map(([key]) => fieldTranslation[key] || key)
    .join(', ');

  return missingFields
    ? `아직 입력되지 않은 정보는 다음과 같습니다: ${missingFields}.`
    : '모든 필드가 입력되었습니다.';
}
const cityMapping = {
  // Major cities
  서울: 'SEL',
  인천: 'ICN',
  부산: 'PUS',
  대구: 'TAE',
  대전: 'DCC',
  광주: 'KWJ',
  울산: 'USN',
  제주: 'CJU',
  수원: 'SWU',
  성남: 'SNM',
  춘천: 'CHN',
  강릉: 'GRN',

  // Airports
  김포공항: 'GMP',
  인천공항: 'ICN',
  제주공항: 'CJU',
  김해공항: 'PUS',
  대구공항: 'TAE',
  청주공항: 'CJJ',
  광주공항: 'KWJ',
  울산공항: 'USN',
  여수공항: 'RSU',
  포항공항: 'KPO',
  양양공항: 'YNY',
  원주공항: 'WJU',
  무안공항: 'MWX',
  사천공항: 'HIN',

  // Train stations
  서울역: 'SEO',
  용산역: 'YON',
  부산역: 'PSN',
  대전역: 'DJC',
  대구역: 'TAE',
  광주송정역: 'GWJ',
  울산역: 'USN',
  인천역: 'INC',
  춘천역: 'CHC',
  강릉역: 'GRG',
  수서역: 'SUS',
  동대구역: 'DDG',
  익산역: 'IKS',
  전주역: 'JJR',
  목포역: 'MKP',
  여수엑스포역: 'YSR',
  포항역: 'POH',

  // Ports
  부산항: 'BPH',
  인천항: 'IPH',
  울산항: 'UPH',
  평택항: 'PTH',
  여수항: 'YHP',
  목포항: 'MHP',
  포항항: 'PHP',
  제주항: 'JPH',
  광양항: 'GPH',
  삼천포항: 'SCH',
  동해항: 'DHH',
  속초항: 'SCH',
  마산항: 'MSH',
  진해항: 'JHH',
  군산항: 'GSH',

  // Additional locations
  서산항: 'SSH',
  태안항: 'TAH',
  울릉항: 'ULH',
  독도항: 'DDH',
  화물터미널: 'CFT',
  국제물류기지: 'ILB',
  남해항: 'NHN',
  거제항: 'GJH',

  // International Ports and Airports (for reference)
  상하이항: 'SHA',
  홍콩항: 'HKG',
  싱가포르항: 'SIN',
  도쿄항: 'TYO',
  뉴욕항: 'NYH',
  로스앤젤레스항: 'LAH',
  런던항: 'LDH',
  함부르크항: 'HAM',
  두바이항: 'DXB',
};
function convertCityIdentifier(cityIdentifier) {
  // 입력값이 도시 이름이면 코드를 반환
  const code = cityMapping[cityIdentifier];
  if (code) return code;

  // 입력값이 도시 코드면 이름을 반환 (역방향 검색)
  const name = Object.keys(cityMapping).find((name) => cityMapping[name] === cityIdentifier);
  return name || 'unknown'; // 못 찾으면 'unknown' 반환
}

module.exports = {
  formatDateTimestamp,
  isNotDefaultValue,
  isValidDateFormat,
  fieldTranslation,
  formatFieldValue,
  generateMissingFieldsMessage,
  containerSizeMapping,
  convertCityIdentifier,
};
