import styles from './page.module.scss';
import React from 'react';
import { ChatUI } from '../features/chat/ui/ChatUI';

const App: React.FC = () => {
  return (
    <div className={styles.customauthenticator}>
      <ChatUI />
    </div>
  );
};
export default App;
