import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Amplify } from 'aws-amplify';
// @ts-ignore - amplify_outputs.json is generated at build/deploy time
import outputs from '../amplify_outputs.json';
import { store } from './store';
import App from './App';
import './index.css';

// Configure Amplify with outputs from amplify_outputs.json
// This file is generated automatically during Amplify deployments
// For local development, run 'npx ampx sandbox' first to generate it
Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);


