// 색상을 설정하는 함수
export const getTagColor = (flag: number): string => {
  switch (flag) {
    case 0:
      return 'var(--sub03)';
    case 1:
      return 'var(--primary)';
    case 2:
      return 'var(--red01)';
    case 3:
      return 'var(--yellow01)';
    default:
      return 'var(--yellow01)';
  }
};

export const getTagName = (flag: number): string => {
  switch (flag) {
    case 0:
      return '스팸';
    case 1:
      return '주문';
    case 2:
      return '견적';
    case 3:
      return '기타';
    default:
      return '기타'; // 기본 회색, 기타 메일에 사용
  }
};
