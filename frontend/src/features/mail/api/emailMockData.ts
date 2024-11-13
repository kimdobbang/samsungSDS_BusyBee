export const emailMockData = [
  {
    Key: '1',
    title: 'Welcome to our service',
    Size: 1024,
    LastModified: new Date().toISOString(),
    senderName: 'Alice',
    senderEmail: 'alice@example.com',
    body: 'This is a welcome email body.',
  },
  {
    Key: '2',
    title: 'Important update on your account',
    Size: 2048,
    LastModified: new Date(new Date().getTime() - 86400000).toISOString(),
    senderName: 'Bob',
    senderEmail: 'bob@example.com',
    body: 'This email contains an important update.',
  },
  {
    Key: '3',
    title: 'Your monthly report is ready',
    Size: 3072,
    LastModified: new Date(new Date().getTime() - 172800000).toISOString(),
    senderName: 'Charlie',
    senderEmail: 'charlie@example.com',
    body: 'Your monthly report details are here.',
  },
];

// Key 값을 기준으로 특정 이메일 데이터를 찾는 함수
export function getEmailByKey(key: string) {
  return emailMockData.find((email) => email.Key === key) || null;
}
