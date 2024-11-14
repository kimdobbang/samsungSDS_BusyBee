export const ParseDate = (dateString: any) => {
  try {
    const datePattern =
      /(\d{4})\.\s?(\d{1,2})\.\s?(\d{1,2})\.\s?(오전|오후)\s(\d{1,2}):(\d{2}):(\d{2})/;
    const match = dateString.match(datePattern);

    if (!match) {
      console.error('Invalid date format:', dateString);
      return null;
    }

    const [, year, month, day, period, rawHour, minute, second] = match;
    const hour = parseInt(rawHour, 10);
    const normalizedHour =
      period === '오후' && hour < 12
        ? hour + 12
        : period === '오전' && hour === 12
        ? 0
        : hour;

    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      normalizedHour,
      parseInt(minute, 10),
      parseInt(second, 10)
    );
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};
