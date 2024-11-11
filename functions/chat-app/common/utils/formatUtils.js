// formatUtils

function formatDateTimestamp(timestamp) {
  if (!timestamp || isNaN(new Date(timestamp).getTime())) {
    return "지난 대화";
  }
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

module.exports = { formatDateTimestamp };
