import styles from './page.module.scss';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthUI } from '../features';
// import { Voice } from '../features';
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<AuthUI />} />
        <Route path='/ChatUI' element={<AuthUI />} />
      </Routes>
    </Router>
  );
};
export default App;
