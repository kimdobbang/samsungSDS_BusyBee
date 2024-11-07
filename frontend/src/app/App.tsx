import styles from './page.module.scss';
import React from 'react';
// import { Auth } from '../features';
import { ChatUI } from '../features';
// import { Voice } from '../features';
const App: React.FC = () => {
  return (
    <div className={styles.customauthenticator}>
      <ChatUI />
    </div>
  );
};
export default App;
