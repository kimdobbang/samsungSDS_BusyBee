import axios from 'axios';

export const sendGetItems = async () => {
  try {
    const res = await axios.get(
      'https://phrg9804g9.execute-api.ap-northeast-2.amazonaws.com/dev/test-evaluate',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: false, // 필요 시 설정
      }
    );
    console.log(res);
    return res;
  } catch (e) {
    console.error('Error:', e);
    throw e;
  }
};
