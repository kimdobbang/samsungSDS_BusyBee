import axios from 'axios';

export const sendGetItems = async () => {
  try {
    const res = await axios.get(
      'https://phrg9804g9.execute-api.ap-northeast-2.amazonaws.com/dev/test-evaluate'
    );
    const data = res.data.exis;
    return data;
  } catch (e) {
    console.error('Error:', e);
    throw e;
  }
};
