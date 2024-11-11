// 이메일보드 API 처리 코드

export const fetchEmailsByReceiver = async (receiver: string) => {
  try {
    const response = await fetch(
      `https://a557tt8du3.execute-api.ap-northeast-2.amazonaws.com/api/mails?receiver=${receiver}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }

    const data = await response.json();
    // console.log('DATA: ', data);
    return data; // 이메일 데이터 반환
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error; // 에러를 호출자에게 전달
  }
};
