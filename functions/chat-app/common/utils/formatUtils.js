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

module.exports = { formatDateTimestamp, isNotDefaultValue, isValidDateFormat };
