import { ParseDate } from './getChangeDate';

export const CountByDate = (data: any) => {
  const today = new Date();
  let todayCount = 0;
  let monthCount = 0;

  data.forEach((item: any) => {
    const receivedDate = ParseDate(item.received_date.S); // 날짜 파싱
    if (!receivedDate) return;

    // 오늘 날짜 확인
    if (
      receivedDate.getDate() === today.getDate() &&
      receivedDate.getMonth() === today.getMonth() &&
      receivedDate.getFullYear() === today.getFullYear()
    ) {
      todayCount++;
    }

    // 이번 달 확인
    if (
      receivedDate.getMonth() === today.getMonth() &&
      receivedDate.getFullYear() === today.getFullYear()
    ) {
      monthCount++;
    }
  });

  return { todayCount, monthCount };
};
