import React from 'react';
import ReactDOM from 'react-dom';
import Substations_Fiders from './fider_relay';

const App = () => {
  return (
    <>
      <Substations_Fiders />
    </>
  );
};

const rootNode = document.getElementById('app');
const root = ReactDOM.createRoot(rootNode);
root.render(<App />);