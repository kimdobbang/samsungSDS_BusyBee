import { RowData } from '../model/boardmodel';
import { ParseDate } from 'shared/utils/getChangeDate';

export const sortByReceivedDate = (data: RowData[]): RowData[] => {
  return data.sort((a, b) => {
    const dateA = ParseDate(a.received_date.S);
    const dateB = ParseDate(b.received_date.S);

    if (!dateA || !dateB) return 0;

    return dateB.getTime() - dateA.getTime(); // 내림차순 정렬
  });
};
