import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Mail } from 'shared/types/board';

interface MailStoreProps {
  mails: Mail[];
  setMails: (newMails: Mail[]) => void;
  getMail: (receiver: string, received_date: string) => Mail | undefined;
}

const useMailStore = create(
  persist<MailStoreProps>(
    (set, get) => ({
      mails: [],
      setMails: (newMails) => set({ mails: newMails }),

      // receiver와 received_date를 기반으로 메일 찾기
      getMail: (receiver, received_date) => {
        return get().mails.find(
          (mail) =>
            mail.receiver === receiver && mail.received_date === received_date
        );
      },
    }),
    {
      name: 'mail-storage', // sessionStorage에 저장될 키 이름
      storage: createJSONStorage(() => sessionStorage), // sessionStorage 사용
    }
  )
);

export default useMailStore;
