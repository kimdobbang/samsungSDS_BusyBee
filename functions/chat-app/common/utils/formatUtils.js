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
module.exports = {
  formatDateTimestamp,
  isNotDefaultValue,
  isValidDateFormat,
  fieldTranslation,
  formatFieldValue,
  generateMissingFieldsMessage,
  containerSizeMapping,
};
