export const getWebSocketUrl = (orderId: string | null): string => {
  const apiUrl = `wss://3q2gfm3fql.execute-api.ap-northeast-2.amazonaws.com/dev`;
  return `${apiUrl}?orderId=${orderId}`;
};
