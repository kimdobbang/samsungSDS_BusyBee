// 이메일보드 API 처리 코드
import axios from 'axios';

export const fetchEmailsByReceiver = async (receiver: string) => {
  try {
    const response = await fetch(
      `https://a557tt8du3.execute-api.ap-northeast-2.amazonaws.com/api/mails?receiver=${receiver}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }

    const data = await response.json();
    console.log('DATA: ', data);

    return data; // 이메일 데이터 반환
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error; // 에러를 호출자에게 전달
  }
};

export const sendToLambda = async (receiver: string) => {
  try {
    const res = await axios.post(
      'https://j4s4yvr1x3.execute-api.ap-northeast-2.amazonaws.com/dev/dashboard',
      JSON.stringify({
        receiver: receiver,
      })
    );
    const data = res.data;

    return data;
  } catch (e) {
    console.error('Error:', e);
    throw e;
  }
};
