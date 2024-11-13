import axios from 'axios';

export const getWebSocketUrl = (orderId: string | null): string => {
  const apiUrl = `wss://00v93zeny4.execute-api.ap-northeast-2.amazonaws.com/dev/`;
  return `${apiUrl}?orderId=${orderId}`;
};

export const sendDataToLambda = async (orderId: string, email: string) => {
  try {
    const res = await axios.post(
      'https://igghjtqb1d.execute-api.ap-northeast-2.amazonaws.com/dev/ChatUI',
      JSON.stringify({
        orderId: orderId,
        email: email,
      })
    );
    const data = res.data.exists;

    return data;
  } catch (e) {
    console.error('Error:', e);
    throw e;
  }
};
