// import { useEffect } from 'react';
// import useBoardStore from 'features/board/store/useBoardStore';

// export const useBoard = (receiver: string) => {
//   const { items, itemCount, loading, error, fetchItems } = useBoardStore();

//   // receiver가 변경될 때마다 이메일 목록을 가져옴
//   useEffect(() => {
//     if (receiver) {
//       fetchItems(receiver);
//     }
//   }, [receiver, fetchItems]);

//   return { items, itemCount, loading, error, fetchItems };
// };

export const useBoard = () => {};
