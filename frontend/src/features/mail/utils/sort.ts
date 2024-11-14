import { Mail } from 'shared/types/board';
import { RowData } from 'features/dashboard/model/boardmodel';
import { ParseDate } from 'shared/utils/getChangeDate';

export const sortByReceivedDate = (data: RowData[]): RowData[] => {
  return data.sort((a, b) => {
    const dateA = ParseDate(a.received_date.S);
    const dateB = ParseDate(b.received_date.S);

    if (!dateA || !dateB) return 0;

    return dateB.getTime() - dateA.getTime(); // 내림차순 정렬
  });
};

// Mail 타입의 데이터를 최신순으로 정렬하는 함수
export const sortMailsByReceivedDate = (data: Mail[]): Mail[] => {
  return data.sort((a, b) => {
    const dateA = ParseDate(a.received_date);
    const dateB = ParseDate(b.received_date);

    if (!dateA || !dateB) return 0; // 날짜 파싱에 실패하면 순서를 변경하지 않음

    return dateB.getTime() - dateA.getTime(); // 내림차순 정렬
  });
};
