// 수정된 Mail 인터페이스
export interface Mail {
  receiver: string;
  received_date: string;
  sender: string;
  subject: string;
  emailContent: string;
  flag: number;
  key: string;
  emailId: string;
  nickname?: string; // 추가된 속성
  email?: string; // 추가된 속성
  attachments?: string[];
}
