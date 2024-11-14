import axios from 'axios';

export const sendDataToLambda = async (
  REreceiver: string,
  sender: string,
  text: string
) => {
  try {
    const res = await axios.post(
      'https://ob4uq2x74e.execute-api.ap-northeast-2.amazonaws.com/dev/sendmail',

      JSON.stringify({
        REreceiver: REreceiver,
        sender: sender,
        text: text,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const data = res.data;

    return data;
  } catch (e) {
    console.error('Error:', e);
    throw e;
  }
};
