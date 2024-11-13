export const getNickname = (sender: string) => {
  // 정규 표현식을 사용하여 닉네임과 이메일을 추출
  const regex = /"(.+)" <(.+)>/;
  const match = sender.match(regex);

  if (match) {
    const nickname = match[1]; // 닉네임 추출
    const email = match[2]; // 이메일 추출

    return { nickname, email }; // 닉네임과 이메일 반환
  } else {
    // 형식이 일치하지 않는 경우 @ 앞부분을 nickname으로 반환
    return { nickname: sender.split('@')[0], email: sender };
  }
};
