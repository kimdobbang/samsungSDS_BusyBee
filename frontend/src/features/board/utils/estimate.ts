export const CountInProgressQuotes = (data: any) => {
  return data.filter((item: any) => item.status.N !== 5).length;
};
