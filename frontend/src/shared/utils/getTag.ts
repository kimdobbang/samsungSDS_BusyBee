// 색상을 설정하는 함수
export const getTagColor = (flag: number): string => {
  switch (flag) {
    case 0:
      return 'var(--red01)';
    case 1:
      return 'var(--blue01)';
    case 2:
      return 'var(--orange01)';
    case 3:
      return 'var(--green01)';
    default:
      return 'var(--green01)';
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
      return '기타';
  }
};
