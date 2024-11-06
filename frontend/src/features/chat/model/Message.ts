//이것도 message 넘어오는거 확인해서 인터페이스 추가 및 제거 필요함
export type Message = {
  sender: string;
  content: string;
  time?: string;
};
