export const ParseDate = (dateString: any) => {
  try {
    const datePattern =
      /(\d{4})\.\s?(\d{1,2})\.\s?(\d{1,2})\.\s?(오전|오후)\s(\d{1,2}):(\d{2}):(\d{2})/;
    const match = dateString.match(datePattern);

    if (!match) {
      console.error('Invalid date format:', dateString);
      return null;
    }

    const [, year, month, day, period, hour, minute, second] = match.map(
      (value: any, index: any) => (index > 0 ? parseInt(value, 10) : value)
    );

    const normalizedHour = period === '오후' && hour < 12 ? hour + 12 : hour;

    return new Date(year, month - 1, day, normalizedHour, minute, second);
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};
