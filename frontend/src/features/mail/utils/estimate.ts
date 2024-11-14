import { ParseDate } from 'shared/utils/getChangeDate';

export const getTodayOrderMail = (data: any) => {
  const today = new Date();

  let todayMail: any[] = [];

  data.forEach((item: any) => {
    const receivedDate = ParseDate(item.received_date.S); // 날짜 파싱
    if (!receivedDate) return;

    if (
      receivedDate.getDate() === today.getDate() &&
      receivedDate.getMonth() === today.getMonth() &&
      receivedDate.getFullYear() === today.getFullYear()
    ) {
      todayMail.push(item);
    }
  });
  // todayMail.reverse();
  return todayMail;
};

export const getMonthOrderMail = (data: any) => {
  const today = new Date();

  let MonthMail: any[] = [];

  data.forEach((item: any) => {
    const receivedDate = ParseDate(item.received_date.S); // 날짜 파싱
    if (!receivedDate) return;

    if (
      receivedDate.getMonth() === today.getMonth() &&
      receivedDate.getFullYear() === today.getFullYear()
    ) {
      MonthMail.push(item);
    }
  });
  // MonthMail.reverse();
  return MonthMail;
};
