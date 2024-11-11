export interface Mail {
  receiver: string;
  received_date: string;
  sender: string;
  subject: string;
  emailContent: string;
  flag?: string;
  key: string;
  emailId: string;
}
